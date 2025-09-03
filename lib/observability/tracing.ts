import { AsyncLocalStorage } from 'async_hooks';
import { nanoid } from 'nanoid';
import { observabilityLogger } from './logger';
import { metrics } from './metrics';

// Trace context interface
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  tags: Record<string, any>;
  logs: Array<{
    timestamp: number;
    fields: Record<string, any>;
  }>;
}

// Active spans storage
const traceStorage = new AsyncLocalStorage<TraceContext>();
const activeSpans = new Map<string, TraceContext>();

// Span class for managing distributed tracing
export class Span {
  private context: TraceContext;
  private finished = false;

  constructor(
    operationName: string,
    parentContext?: TraceContext,
    tags: Record<string, any> = {}
  ) {
    this.context = {
      traceId: parentContext?.traceId || nanoid(),
      spanId: nanoid(),
      parentSpanId: parentContext?.spanId,
      operationName,
      startTime: Date.now(),
      tags: { ...tags },
      logs: [],
    };

    activeSpans.set(this.context.spanId, this.context);
    
    observabilityLogger.debug('Span started', {
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      parentSpanId: this.context.parentSpanId,
      operationName,
      tags,
    });
  }

  // Add tags to span
  setTag(key: string, value: any): Span {
    this.context.tags[key] = value;
    return this;
  }

  // Add multiple tags
  setTags(tags: Record<string, any>): Span {
    Object.assign(this.context.tags, tags);
    return this;
  }

  // Log structured data
  log(fields: Record<string, any>): Span {
    this.context.logs.push({
      timestamp: Date.now(),
      fields,
    });
    return this;
  }

  // Log an event
  logEvent(event: string, payload?: any): Span {
    return this.log({
      event,
      ...payload,
    });
  }

  // Set error on span
  setError(error: Error): Span {
    this.setTag('error', true);
    this.setTag('error.message', error.message);
    this.setTag('error.stack', error.stack);
    this.log({
      event: 'error',
      'error.object': error,
      message: error.message,
    });
    return this;
  }

  // Finish span
  finish(): void {
    if (this.finished) return;

    const duration = Date.now() - this.context.startTime;
    this.setTag('duration_ms', duration);
    
    observabilityLogger.debug('Span finished', {
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      operationName: this.context.operationName,
      duration,
      tags: this.context.tags,
      logs: this.context.logs,
    });

    // Record metrics
    metrics.observe('span_duration_seconds', duration / 1000);
    
    activeSpans.delete(this.context.spanId);
    this.finished = true;
  }

  // Get span context
  getContext(): TraceContext {
    return { ...this.context };
  }

  // Run code within this span context
  run<T>(fn: () => T): T {
    return traceStorage.run(this.context, fn);
  }

  // Run async code within this span context
  async runAsync<T>(fn: () => Promise<T>): Promise<T> {
    return traceStorage.run(this.context, fn);
  }
}

// Tracer class for creating and managing spans
export class Tracer {
  private serviceName: string;

  constructor(serviceName: string = 'fluxao') {
    this.serviceName = serviceName;
  }

  // Create a new span
  startSpan(operationName: string, tags: Record<string, any> = {}): Span {
    const parentContext = traceStorage.getStore();
    
    // Add service name to tags
    const spanTags = {
      'service.name': this.serviceName,
      ...tags,
    };

    return new Span(operationName, parentContext, spanTags);
  }

  // Create a child span
  startChildSpan(operationName: string, tags: Record<string, any> = {}): Span {
    const parentContext = traceStorage.getStore();
    if (!parentContext) {
      return this.startSpan(operationName, tags);
    }

    return new Span(operationName, parentContext, tags);
  }

  // Get current active span
  getActiveSpan(): Span | null {
    const context = traceStorage.getStore();
    if (!context) return null;

    // Create a span wrapper for the active context
    const span = new Span('active', context);
    span['context'] = context; // Access private field
    return span;
  }

  // Get current trace ID
  getTraceId(): string | null {
    const context = traceStorage.getStore();
    return context?.traceId || null;
  }

  // Trace a synchronous function
  trace<T>(operationName: string, fn: (span: Span) => T, tags?: Record<string, any>): T {
    const span = this.startSpan(operationName, tags);
    try {
      const result = span.run(() => fn(span));
      return result;
    } catch (error) {
      span.setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.finish();
    }
  }

  // Trace an asynchronous function
  async traceAsync<T>(
    operationName: string,
    fn: (span: Span) => Promise<T>,
    tags?: Record<string, any>
  ): Promise<T> {
    const span = this.startSpan(operationName, tags);
    try {
      const result = await span.runAsync(() => fn(span));
      return result;
    } catch (error) {
      span.setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.finish();
    }
  }
}

// Global tracer instance
export const tracer = new Tracer('fluxao');

// Decorator for automatic tracing
export function traced(operationName?: string, tags?: Record<string, any>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return tracer.traceAsync(name, async (span) => {
        // Add method context to tags
        span.setTags({
          'method.class': target.constructor.name,
          'method.name': propertyName,
          'args.length': args.length,
          ...tags,
        });

        const result = await method.apply(this, args);
        
        // Log successful completion
        span.logEvent('method.completed', {
          'result.type': typeof result,
        });

        return result;
      });
    };
  };
}

// HTTP request tracing middleware
export function createTracingMiddleware() {
  return (req: any, res: any, next: any) => {
    const span = tracer.startSpan('http.request', {
      'http.method': req.method,
      'http.url': req.url,
      'http.path': req.path,
      'http.user_agent': req.headers['user-agent'],
      'http.remote_addr': req.ip || req.connection?.remoteAddress,
    });

    // Add trace headers to response
    const traceId = span.getContext().traceId;
    const spanId = span.getContext().spanId;
    
    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Span-ID', spanId);

    // Log request start
    span.logEvent('http.request.start', {
      headers: req.headers,
      query: req.query,
      body: req.body,
    });

    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      span.setTags({
        'http.status_code': res.statusCode,
        'http.response.size': res.get('content-length'),
      });

      // Log response
      span.logEvent('http.request.end', {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      });

      if (res.statusCode >= 400) {
        span.setTag('error', true);
        span.logEvent('http.error', {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
        });
      }

      span.finish();
      originalEnd.apply(this, args);
    };

    // Run request in span context
    span.run(() => next());
  };
}

// Database query tracing
export function traceDbQuery<T>(
  operation: string,
  query: string,
  params?: any[]
): (fn: () => Promise<T>) => Promise<T> {
  return async (fn: () => Promise<T>): Promise<T> => {
    return tracer.traceAsync('db.query', async (span) => {
      span.setTags({
        'db.operation': operation,
        'db.statement': query.substring(0, 1000), // Limit length
        'db.params.count': params?.length || 0,
      });

      const startTime = Date.now();
      
      try {
        const result = await fn();
        
        const duration = Date.now() - startTime;
        span.setTag('db.duration_ms', duration);
        
        span.logEvent('db.query.success', {
          duration,
          resultType: typeof result,
        });

        // Record database metrics
        metrics.dbQuery(operation, 'unknown', duration, true);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        span.setTag('db.duration_ms', duration);
        span.setError(error instanceof Error ? error : new Error(String(error)));
        
        // Record database metrics
        metrics.dbQuery(operation, 'unknown', duration, false);
        
        throw error;
      }
    });
  };
}

// Cache operation tracing
export function traceCacheOperation<T>(
  operation: string,
  key: string
): (fn: () => Promise<T>) => Promise<T> {
  return async (fn: () => Promise<T>): Promise<T> => {
    return tracer.traceAsync('cache.operation', async (span) => {
      span.setTags({
        'cache.operation': operation,
        'cache.key': key.substring(0, 100), // Limit length
      });

      try {
        const result = await fn();
        
        span.logEvent('cache.operation.success', {
          operation,
          key: key.substring(0, 50),
        });

        // Record cache metrics
        metrics.cache(operation as any, key);

        return result;
      } catch (error) {
        span.setError(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });
  };
}

// External API call tracing
export function traceApiCall<T>(
  service: string,
  endpoint: string
): (fn: () => Promise<T>) => Promise<T> {
  return async (fn: () => Promise<T>): Promise<T> => {
    return tracer.traceAsync('api.call', async (span) => {
      span.setTags({
        'api.service': service,
        'api.endpoint': endpoint,
      });

      const startTime = Date.now();
      
      try {
        const result = await fn();
        
        const duration = Date.now() - startTime;
        span.setTag('api.duration_ms', duration);
        
        span.logEvent('api.call.success', {
          duration,
          service,
          endpoint,
        });

        // Record API metrics (assuming 200 status for success)
        metrics.apiRequest(service, endpoint, duration, 200);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        span.setTag('api.duration_ms', duration);
        span.setError(error instanceof Error ? error : new Error(String(error)));
        
        // Record API metrics (assuming 500 status for error)
        metrics.apiRequest(service, endpoint, duration, 500);
        
        throw error;
      }
    });
  };
}

// Get all active spans for debugging
export function getActiveSpans(): TraceContext[] {
  return Array.from(activeSpans.values());
}

// Trace context utilities
export { traceStorage };

export default tracer;