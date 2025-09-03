/**
 * Production Monitoring and Health Checks System
 * Comprehensive monitoring for production readiness
 */

import { prisma } from './prisma';
import { logger } from './logger';
import { getRedisClient } from './redis';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  checks: Record<string, ComponentHealth>;
  version: string;
  environment: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
  lastCheck?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemMetrics {
  memory: {
    used: number;
    free: number;
    total: number;
    usage: number; // percentage
  };
  cpu: {
    usage: number; // percentage (if available)
    loadAverage?: number[];
  };
  database: {
    connections: number;
    responseTime: number;
    status: 'connected' | 'disconnected' | 'error';
  };
  cache: {
    status: 'connected' | 'disconnected' | 'unavailable';
    memory?: number;
    keys?: number;
    responseTime?: number;
  };
  application: {
    activeUsers: number;
    requestsPerMinute: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

/**
 * Core Health Check Service
 */
class HealthCheckService {
  private readonly startTime = Date.now();
  private lastMetrics: SystemMetrics | null = null;
  private lastHealthCheck: HealthCheckResult | null = null;

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    logger.info('Starting health check');

    const checks: Record<string, ComponentHealth> = {};

    // Database health check
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1 as health_check`;
      const dbResponseTime = Date.now() - dbStart;
      
      // Check database connectivity and basic operations
      const userCount = await prisma.user.count();
      
      checks.database = {
        status: 'healthy',
        responseTime: dbResponseTime,
        lastCheck: new Date(),
        metadata: {
          userCount,
          responseTimeMs: dbResponseTime
        }
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown database error',
        lastCheck: new Date()
      };
    }

    // Redis/Cache health check
    try {
      const redis = getRedisClient();
      if (redis) {
        const cacheStart = Date.now();
        await redis.ping();
        const cacheResponseTime = Date.now() - cacheStart;
        
        checks.cache = {
          status: 'healthy',
          responseTime: cacheResponseTime,
          lastCheck: new Date(),
          metadata: {
            responseTimeMs: cacheResponseTime
          }
        };
      } else {
        checks.cache = {
          status: 'degraded',
          message: 'Redis not configured, using in-memory cache',
          lastCheck: new Date()
        };
      }
    } catch (error) {
      checks.cache = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Cache connection failed',
        lastCheck: new Date()
      };
    }

    // Authentication system check
    try {
      const authStart = Date.now();
      // Test basic auth operations
      const recentUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      const authResponseTime = Date.now() - authStart;

      checks.authentication = {
        status: 'healthy',
        responseTime: authResponseTime,
        lastCheck: new Date(),
        metadata: {
          recentSignups: recentUsers
        }
      };
    } catch (error) {
      checks.authentication = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Auth system error',
        lastCheck: new Date()
      };
    }

    // Newsletter system check
    try {
      const newsletterStart = Date.now();
      const subscriberCount = await prisma.newsletterSubscriber.count();
      const recentCampaigns = await prisma.newsletterCampaign.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });
      const newsletterResponseTime = Date.now() - newsletterStart;

      checks.newsletter = {
        status: 'healthy',
        responseTime: newsletterResponseTime,
        lastCheck: new Date(),
        metadata: {
          totalSubscribers: subscriberCount,
          recentCampaigns
        }
      };
    } catch (error) {
      checks.newsletter = {
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Newsletter system error',
        lastCheck: new Date()
      };
    }

    // File system check (basic)
    try {
      const fs = await import('fs/promises');
      await fs.access(process.cwd(), fs.constants.R_OK | fs.constants.W_OK);
      
      checks.filesystem = {
        status: 'healthy',
        lastCheck: new Date(),
        message: 'File system accessible'
      };
    } catch (error) {
      checks.filesystem = {
        status: 'unhealthy',
        error: 'File system access denied',
        lastCheck: new Date()
      };
    }

    // Environment configuration check
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'JWT_SECRET'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'degraded',
      lastCheck: new Date(),
      metadata: {
        missingVars: missingEnvVars,
        nodeEnv: process.env.NODE_ENV
      },
      ...(missingEnvVars.length > 0 && {
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`
      })
    };

    // Determine overall health status
    const healthyCount = Object.values(checks).filter(check => check.status === 'healthy').length;
    const unhealthyCount = Object.values(checks).filter(check => check.status === 'unhealthy').length;
    const totalChecks = Object.keys(checks).length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (healthyCount < totalChecks) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      checks,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    this.lastHealthCheck = result;

    logger.info(
      {
        status: overallStatus,
        checksCompleted: totalChecks,
        healthy: healthyCount,
        degraded: totalChecks - healthyCount - unhealthyCount,
        unhealthy: unhealthyCount,
        duration: Date.now() - startTime
      },
      'Health check completed'
    );

    return result;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const startTime = Date.now();

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memory = {
      used: memoryUsage.heapUsed,
      free: memoryUsage.heapTotal - memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      usage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    };

    // CPU usage (basic)
    const loadAverage = process.platform !== 'win32' ? require('os').loadavg() : undefined;
    const cpu = {
      usage: 0, // Would need additional monitoring for accurate CPU usage
      loadAverage
    };

    // Database metrics
    let database;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - dbStart;

      database = {
        connections: 1, // SQLite doesn't expose connection count
        responseTime,
        status: 'connected' as const
      };
    } catch (error) {
      database = {
        connections: 0,
        responseTime: 0,
        status: 'error' as const
      };
    }

    // Cache metrics
    let cache;
    try {
      const redis = getRedisClient();
      if (redis) {
        const cacheStart = Date.now();
        await redis.ping();
        const responseTime = Date.now() - cacheStart;

        cache = {
          status: 'connected' as const,
          responseTime,
          keys: 0, // Would need to query Redis for accurate count
          memory: 0 // Would need Redis INFO command
        };
      } else {
        cache = {
          status: 'unavailable' as const
        };
      }
    } catch (error) {
      cache = {
        status: 'disconnected' as const
      };
    }

    // Application metrics (basic implementation)
    const application = {
      activeUsers: 0, // Would need session tracking
      requestsPerMinute: 0, // Would need request counting
      errorRate: 0, // Would need error tracking
      averageResponseTime: Date.now() - startTime
    };

    const metrics: SystemMetrics = {
      memory,
      cpu,
      database,
      cache,
      application
    };

    this.lastMetrics = metrics;
    return metrics;
  }

  /**
   * Get readiness status (for Kubernetes readiness probes)
   */
  async isReady(): Promise<boolean> {
    try {
      // Check critical dependencies
      await prisma.$queryRaw`SELECT 1`;
      
      // Check if the application can handle requests
      return true;
    } catch (error) {
      logger.error({ error }, 'Readiness check failed');
      return false;
    }
  }

  /**
   * Get liveness status (for Kubernetes liveness probes)
   */
  async isAlive(): Promise<boolean> {
    try {
      // Basic liveness check - if we can execute this, we're alive
      return true;
    } catch (error) {
      logger.error({ error }, 'Liveness check failed');
      return false;
    }
  }

  /**
   * Get cached health check result
   */
  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }

  /**
   * Get cached metrics
   */
  getLastMetrics(): SystemMetrics | null {
    return this.lastMetrics;
  }

  /**
   * Start background health monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    logger.info({ intervalMs }, 'Starting background health monitoring');

    setInterval(async () => {
      try {
        await this.performHealthCheck();
        await this.getSystemMetrics();
      } catch (error) {
        logger.error({ error }, 'Background health check failed');
      }
    }, intervalMs);
  }
}

// Performance monitoring helpers
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  /**
   * Record execution time for an operation
   */
  static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(duration);

    // Keep only last 100 measurements per operation
    if (operationMetrics.length > 100) {
      operationMetrics.splice(0, operationMetrics.length - 100);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  static getStats(operation: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics || operationMetrics.length === 0) {
      return null;
    }

    const sorted = [...operationMetrics].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, average, min, max, p95 };
  }

  /**
   * Wrap an async function with performance monitoring
   */
  static async monitor<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(`${operation}_error`, duration);
      throw error;
    }
  }

  /**
   * Get all performance statistics
   */
  static getAllStats(): Record<string, ReturnType<typeof PerformanceMonitor.getStats>> {
    const allStats: Record<string, ReturnType<typeof PerformanceMonitor.getStats>> = {};
    
    for (const [operation] of this.metrics) {
      allStats[operation] = this.getStats(operation);
    }

    return allStats;
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();

/**
 * Initialize monitoring system
 */
export function initializeMonitoring(options: {
  enableBackgroundMonitoring?: boolean;
  monitoringInterval?: number;
} = {}): void {
  const {
    enableBackgroundMonitoring = true,
    monitoringInterval = 60000 // 1 minute
  } = options;

  logger.info('Initializing monitoring system');

  if (enableBackgroundMonitoring) {
    healthCheckService.startMonitoring(monitoringInterval);
  }

  // Register process event handlers
  process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught exception');
    // Don't exit in production, let PM2/Docker handle restarts
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled promise rejection');
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown');
    
    try {
      // Close database connections
      await prisma.$disconnect();
      
      // Close Redis connections
      const redis = getRedisClient();
      if (redis) {
        await redis.quit();
      }

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  logger.info('Monitoring system initialized');
}

/**
 * Middleware to add correlation IDs to requests
 */
export function correlationIdMiddleware() {
  return (req: Request) => {
    const correlationId = req.headers.get('x-correlation-id') || 
                         req.headers.get('x-request-id') || 
                         crypto.randomUUID();
    
    return correlationId;
  };
}

/**
 * Create a monitoring-aware API wrapper
 */
export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  operationName: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    return PerformanceMonitor.monitor(operationName, () => fn(...args));
  }) as T;
}