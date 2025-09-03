import { NextRequest, NextResponse } from 'next/server';
import { observabilityLogger } from './logger';
import { metrics } from './metrics';
import { tracer } from './tracing';
import { performance } from 'perf_hooks';

// Request performance tracking middleware
export function createObservabilityMiddleware() {
  return async (request: NextRequest) => {
    const startTime = performance.now();
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    
    // Extract request information
    const method = request.method;
    const path = new URL(request.url).pathname;
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    
    // Start tracing
    const span = tracer.startSpan('http.request', {
      'http.method': method,
      'http.path': path,
      'http.url': request.url,
      'http.user_agent': userAgent,
      'http.referer': referer,
      'request.id': requestId,
    });

    try {
      // Process request
      const response = NextResponse.next();
      
      // Add observability headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Trace-ID', span.getContext().traceId);
      response.headers.set('X-Span-ID', span.getContext().spanId);
      
      // Measure response time when response is ready
      response.headers.set('X-Response-Time', '0'); // Will be updated
      
      // Create a promise to handle response completion
      const originalResponse = response.clone();
      
      // Use a different approach to track completion
      setTimeout(() => {
        const duration = performance.now() - startTime;
        const statusCode = response.status;
        
        // Update span with response information
        span.setTags({
          'http.status_code': statusCode,
          'http.response_time_ms': duration,
        });
        
        // Log completion
        span.logEvent('http.response', {
          status: statusCode,
          duration,
        });
        
        // Record metrics
        metrics.httpRequest(method, path, statusCode, duration);
        
        // Log request completion
        observabilityLogger.info('HTTP request completed', {
          method,
          path,
          statusCode,
          duration,
          userAgent,
          referer,
          requestId,
        });
        
        // Finish span
        span.finish();
        
      }, 0);
      
      return response;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Record error in span
      span.setError(error instanceof Error ? error : new Error(String(error)));
      span.setTag('http.status_code', 500);
      
      // Record metrics
      metrics.httpRequest(method, path, 500, duration);
      
      // Log error
      observabilityLogger.error('HTTP request failed', error, {
        method,
        path,
        duration,
        requestId,
      });
      
      span.finish();
      throw error;
    }
  };
}

// API Route wrapper for observability
export function withObservability<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse,
  operationName?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    const [request] = args as [NextRequest, ...any[]];
    const startTime = performance.now();
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    
    const operation = operationName || `${method} ${path}`;
    
    return tracer.traceAsync(operation, async (span) => {
      // Add request context to span
      span.setTags({
        'http.method': method,
        'http.path': path,
        'http.url': request.url,
        'http.user_agent': request.headers.get('user-agent') || '',
      });
      
      try {
        const response = await handler(...args);
        const duration = performance.now() - startTime;
        const statusCode = response.status;
        
        // Update span with response info
        span.setTags({
          'http.status_code': statusCode,
          'http.response_time_ms': duration,
        });
        
        // Record metrics
        metrics.httpRequest(method, path, statusCode, duration);
        
        // Add observability headers
        const traceId = span.getContext().traceId;
        const spanId = span.getContext().spanId;
        
        response.headers.set('X-Trace-ID', traceId);
        response.headers.set('X-Span-ID', spanId);
        response.headers.set('X-Response-Time', duration.toFixed(2));
        
        return response;
        
      } catch (error) {
        const duration = performance.now() - startTime;
        
        span.setError(error instanceof Error ? error : new Error(String(error)));
        
        // Record error metrics
        metrics.httpRequest(method, path, 500, duration);
        
        observabilityLogger.error('API handler error', error, {
          operation,
          method,
          path,
          duration,
        });
        
        throw error;
      }
    });
  };
}

// Database operation wrapper
export function withDbObservability<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  operationName: string,
  tableName?: string
) {
  return async (...args: T): Promise<R> => {
    return tracer.traceAsync(`db.${operationName}`, async (span) => {
      const startTime = performance.now();
      
      span.setTags({
        'db.operation': operationName,
        'db.table': tableName || 'unknown',
        'db.type': 'sqlite',
      });
      
      try {
        const result = await operation(...args);
        const duration = performance.now() - startTime;
        
        span.setTag('db.duration_ms', duration);
        
        // Record database metrics
        metrics.dbQuery(operationName, tableName || 'unknown', duration, true);
        
        return result;
        
      } catch (error) {
        const duration = performance.now() - startTime;
        
        span.setError(error instanceof Error ? error : new Error(String(error)));
        span.setTag('db.duration_ms', duration);
        
        // Record error metrics
        metrics.dbQuery(operationName, tableName || 'unknown', duration, false);
        
        observabilityLogger.error('Database operation failed', error, {
          operation: operationName,
          table: tableName,
          duration,
        });
        
        throw error;
      }
    });
  };
}

// Cache operation wrapper
export function withCacheObservability<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  cacheOperation: 'get' | 'set' | 'delete' | 'clear',
  key?: string
) {
  return async (...args: T): Promise<R> => {
    return tracer.traceAsync(`cache.${cacheOperation}`, async (span) => {
      const startTime = performance.now();
      
      span.setTags({
        'cache.operation': cacheOperation,
        'cache.key': key || 'unknown',
      });
      
      try {
        const result = await operation(...args);
        const duration = performance.now() - startTime;
        
        span.setTag('cache.duration_ms', duration);
        
        // Record cache metrics
        const metricOperation = cacheOperation === 'get' ? 
          (result ? 'hit' : 'miss') : cacheOperation;
        metrics.cache(metricOperation as any, key);
        
        return result;
        
      } catch (error) {
        const duration = performance.now() - startTime;
        
        span.setError(error instanceof Error ? error : new Error(String(error)));
        span.setTag('cache.duration_ms', duration);
        
        observabilityLogger.error('Cache operation failed', error, {
          operation: cacheOperation,
          key,
          duration,
        });
        
        throw error;
      }
    });
  };
}

// External API call wrapper
export function withApiCallObservability<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  service: string,
  endpoint: string
) {
  return async (...args: T): Promise<R> => {
    return tracer.traceAsync(`api.${service}`, async (span) => {
      const startTime = performance.now();
      
      span.setTags({
        'api.service': service,
        'api.endpoint': endpoint,
        'api.type': 'http',
      });
      
      try {
        const result = await operation(...args);
        const duration = performance.now() - startTime;
        
        span.setTag('api.duration_ms', duration);
        span.setTag('api.success', true);
        
        // Record API metrics (assuming success = 200)
        metrics.apiRequest(service, endpoint, duration, 200);
        
        return result;
        
      } catch (error) {
        const duration = performance.now() - startTime;
        
        span.setError(error instanceof Error ? error : new Error(String(error)));
        span.setTag('api.duration_ms', duration);
        span.setTag('api.success', false);
        
        // Record error metrics (assuming error = 500)
        metrics.apiRequest(service, endpoint, duration, 500);
        
        observabilityLogger.error('External API call failed', error, {
          service,
          endpoint,
          duration,
        });
        
        throw error;
      }
    });
  };
}

// Business logic wrapper
export function withBusinessObservability<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  businessEvent: string,
  context?: Record<string, any>
) {
  return async (...args: T): Promise<R> => {
    return tracer.traceAsync(`business.${businessEvent}`, async (span) => {
      const startTime = performance.now();
      
      span.setTags({
        'business.event': businessEvent,
        'business.context': JSON.stringify(context || {}),
      });
      
      try {
        const result = await operation(...args);
        const duration = performance.now() - startTime;
        
        span.setTag('business.duration_ms', duration);
        span.setTag('business.success', true);
        
        // Log business event
        observabilityLogger.business(businessEvent, {
          duration,
          success: true,
          ...context,
        });
        
        return result;
        
      } catch (error) {
        const duration = performance.now() - startTime;
        
        span.setError(error instanceof Error ? error : new Error(String(error)));
        span.setTag('business.duration_ms', duration);
        span.setTag('business.success', false);
        
        observabilityLogger.business(businessEvent, {
          duration,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          ...context,
        });
        
        throw error;
      }
    });
  };
}

export default {
  createObservabilityMiddleware,
  withObservability,
  withDbObservability,
  withCacheObservability,
  withApiCallObservability,
  withBusinessObservability,
};