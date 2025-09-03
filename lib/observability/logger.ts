import pino from 'pino';
import { nanoid } from 'nanoid';
import { AsyncLocalStorage } from 'async_hooks';

// Request context storage
const asyncLocalStorage = new AsyncLocalStorage<{
  requestId: string;
  userId?: string;
  sessionId?: string;
  path?: string;
  method?: string;
}>();

// Create structured logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'apiKey',
      'authorization',
      'cookie',
      'set-cookie'
    ],
    remove: true,
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    request: (req: any) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      headers: {
        'user-agent': req.headers?.['user-agent'],
        'content-type': req.headers?.['content-type'],
        'accept': req.headers?.['accept'],
      },
      query: req.query,
      body: req.body && typeof req.body === 'object' ? 
        Object.keys(req.body).reduce((acc, key) => {
          if (key.toLowerCase().includes('password') || 
              key.toLowerCase().includes('token')) {
            acc[key] = '[REDACTED]';
          } else {
            acc[key] = req.body[key];
          }
          return acc;
        }, {} as any) : req.body,
    }),
    response: (res: any) => ({
      statusCode: res.statusCode,
      headers: res.headers && {
        'content-type': res.headers['content-type'],
        'cache-control': res.headers['cache-control'],
      },
    }),
  },
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost',
    service: 'fluxao',
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  },
});

// Enhanced logger with context
class ObservabilityLogger {
  private baseLogger = logger;

  // Get current request context
  private getContext() {
    return asyncLocalStorage.getStore() || {};
  }

  // Create child logger with context
  private childLogger() {
    const context = this.getContext();
    return this.baseLogger.child(context);
  }

  // Initialize request context
  initRequestContext(req: any, res: any) {
    const requestId = req.headers['x-request-id'] || nanoid();
    const context = {
      requestId,
      userId: req.user?.id,
      sessionId: req.sessionId,
      path: req.path || req.url,
      method: req.method,
    };

    res.setHeader('X-Request-ID', requestId);
    
    return asyncLocalStorage.run(context, () => {
      this.info('Request started', {
        request: req,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
        referer: req.headers.referer,
      });
    });
  }

  // Complete request logging
  completeRequest(req: any, res: any, startTime: number) {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : 
                  res.statusCode >= 400 ? 'warn' : 'info';
    
    this[level]('Request completed', {
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
      response: res,
    });
  }

  // Performance logging
  performance(operation: string, duration: number, metadata?: any) {
    this.info('Performance metric', {
      operation,
      duration,
      ...metadata,
    });
  }

  // Database query logging
  dbQuery(query: string, duration: number, params?: any[]) {
    this.debug('Database query', {
      query: query.substring(0, 1000), // Limit query length
      duration,
      paramCount: params?.length || 0,
    });
  }

  // API call logging
  apiCall(service: string, endpoint: string, duration: number, status: number) {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this[level]('External API call', {
      service,
      endpoint,
      duration,
      status,
    });
  }

  // Cache operations
  cache(operation: 'hit' | 'miss' | 'set' | 'del', key: string, duration?: number) {
    this.debug('Cache operation', {
      operation,
      key: key.substring(0, 100), // Limit key length
      duration,
    });
  }

  // Security events
  security(event: string, details: any) {
    this.warn('Security event', {
      event,
      ...details,
    });
  }

  // Business logic events
  business(event: string, details: any) {
    this.info('Business event', {
      event,
      ...details,
    });
  }

  // Error with stack trace and context
  error(message: string, error?: Error | any, context?: any) {
    this.childLogger().error({
      msg: message,
      err: error,
      ...context,
    });
  }

  // Warning events
  warn(message: string, context?: any) {
    this.childLogger().warn({
      msg: message,
      ...context,
    });
  }

  // Info events
  info(message: string, context?: any) {
    this.childLogger().info({
      msg: message,
      ...context,
    });
  }

  // Debug events
  debug(message: string, context?: any) {
    this.childLogger().debug({
      msg: message,
      ...context,
    });
  }

  // Trace events
  trace(message: string, context?: any) {
    this.childLogger().trace({
      msg: message,
      ...context,
    });
  }

  // Fatal errors that require immediate attention
  fatal(message: string, error?: Error | any, context?: any) {
    this.childLogger().fatal({
      msg: message,
      err: error,
      ...context,
    });
    
    // Also send alert
    this.sendAlert('CRITICAL', message, { error, ...context });
  }

  // Send alert to monitoring system
  private async sendAlert(severity: string, message: string, context: any) {
    // Implementation would integrate with alerting system
    // For now, just log at fatal level
    console.error(`[ALERT ${severity}] ${message}`, context);
  }
}

// Export singleton instance
export const observabilityLogger = new ObservabilityLogger();

// Export types and utilities
export type LogContext = Parameters<typeof observabilityLogger.info>[1];

// Performance measurement decorator
export function measurePerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await method.apply(this, args);
        observabilityLogger.performance(
          `${operation}:${propertyName}`,
          Date.now() - start,
          { success: true }
        );
        return result;
      } catch (error) {
        observabilityLogger.performance(
          `${operation}:${propertyName}`,
          Date.now() - start,
          { success: false, error: error instanceof Error ? error.message : error }
        );
        throw error;
      }
    };
  };
}

// Async context utilities
export { asyncLocalStorage };