import { logger } from './logger';
import { perfCache } from './performance-cache';
import { prisma } from './prisma';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface DatabaseMetrics {
  activeConnections: number;
  slowQueries: number;
  cacheHitRate: number;
  avgResponseTime: number;
}

interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alertThresholds = {
    responseTime: 1000, // 1 second
    memoryUsage: 512 * 1024 * 1024, // 512MB
    cacheHitRate: 70, // 70%
    errorRate: 5, // 5%
  };

  // Track API response times
  async trackApiResponse(endpoint: string, duration: number, success: boolean) {
    const metric: PerformanceMetric = {
      name: 'api_response_time',
      value: duration,
      timestamp: Date.now(),
      metadata: {
        endpoint,
        success,
        slow: duration > this.alertThresholds.responseTime,
      },
    };

    this.metrics.push(metric);

    // Alert on slow responses
    if (duration > this.alertThresholds.responseTime) {
      logger.warn(`Slow API response: ${endpoint} took ${duration}ms`);
      await this.createAlert({
        type: 'PERFORMANCE_ALERT',
        severity: 'warning',
        message: `Slow API response detected: ${endpoint}`,
        details: { endpoint, duration, threshold: this.alertThresholds.responseTime },
      });
    }

    // Store in cache for dashboard
    await perfCache.set(`perf:api:${endpoint}:latest`, metric, 300); // 5 minutes
  }

  // Track database query performance
  async trackDatabaseQuery(query: string, duration: number) {
    const metric: PerformanceMetric = {
      name: 'db_query_time',
      value: duration,
      timestamp: Date.now(),
      metadata: {
        query: query.substring(0, 100), // Truncate for privacy
        slow: duration > 500, // 500ms threshold for DB queries
      },
    };

    this.metrics.push(metric);

    if (duration > 500) {
      logger.warn(`Slow database query: ${duration}ms - ${query.substring(0, 100)}...`);
    }
  }

  // Track cache performance
  async trackCacheOperation(operation: 'hit' | 'miss' | 'set', key: string, duration?: number) {
    const metric: PerformanceMetric = {
      name: `cache_${operation}`,
      value: duration || 1,
      timestamp: Date.now(),
      metadata: { key: key.substring(0, 50) },
    };

    this.metrics.push(metric);
  }

  // Get performance statistics
  async getPerformanceStats(timeRange: number = 3600000): Promise<{
    apiStats: any;
    dbStats: any;
    cacheStats: any;
    systemStats: SystemMetrics;
  }> {
    const cutoff = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    // API statistics
    const apiMetrics = recentMetrics.filter(m => m.name === 'api_response_time');
    const apiStats = {
      totalRequests: apiMetrics.length,
      avgResponseTime: apiMetrics.reduce((acc, m) => acc + m.value, 0) / apiMetrics.length || 0,
      slowRequests: apiMetrics.filter(m => m.metadata?.slow).length,
      errorRate: (apiMetrics.filter(m => !m.metadata?.success).length / apiMetrics.length) * 100 || 0,
    };

    // Database statistics
    const dbMetrics = recentMetrics.filter(m => m.name === 'db_query_time');
    const dbStats = {
      totalQueries: dbMetrics.length,
      avgQueryTime: dbMetrics.reduce((acc, m) => acc + m.value, 0) / dbMetrics.length || 0,
      slowQueries: dbMetrics.filter(m => m.metadata?.slow).length,
    };

    // Cache statistics
    const cacheHits = recentMetrics.filter(m => m.name === 'cache_hit').length;
    const cacheMisses = recentMetrics.filter(m => m.name === 'cache_miss').length;
    const cacheStats = {
      hits: cacheHits,
      misses: cacheMisses,
      hitRate: (cacheHits / (cacheHits + cacheMisses)) * 100 || 0,
      ...perfCache.getStats(),
    };

    // System statistics
    const systemStats: SystemMetrics = {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: Date.now(),
    };

    return { apiStats, dbStats, cacheStats, systemStats };
  }

  // Create performance alert
  private async createAlert(alert: {
    type: string;
    severity: string;
    message: string;
    details: any;
  }) {
    try {
      await prisma.systemAlert.create({
        data: {
          alertId: `perf-${Date.now()}`,
          type: alert.type,
          category: 'performance',
          message: alert.message,
          details: alert.details,
          severity: alert.severity === 'warning' ? 3 : 4,
        },
      });
    } catch (error) {
      logger.error('Failed to create performance alert:', error);
    }
  }

  // Performance health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Record<string, { status: string; value: any; threshold: any }>;
  }> {
    const stats = await this.getPerformanceStats();
    const checks: Record<string, { status: string; value: any; threshold: any }> = {};

    // Check API response time
    checks.apiResponseTime = {
      status: stats.apiStats.avgResponseTime > this.alertThresholds.responseTime ? 'critical' : 'healthy',
      value: Math.round(stats.apiStats.avgResponseTime),
      threshold: this.alertThresholds.responseTime,
    };

    // Check memory usage
    const memoryUsageMB = stats.systemStats.memoryUsage.heapUsed / 1024 / 1024;
    checks.memoryUsage = {
      status: stats.systemStats.memoryUsage.heapUsed > this.alertThresholds.memoryUsage ? 'warning' : 'healthy',
      value: Math.round(memoryUsageMB),
      threshold: this.alertThresholds.memoryUsage / 1024 / 1024,
    };

    // Check cache hit rate
    checks.cacheHitRate = {
      status: stats.cacheStats.hitRate < this.alertThresholds.cacheHitRate ? 'warning' : 'healthy',
      value: Math.round(stats.cacheStats.hitRate),
      threshold: this.alertThresholds.cacheHitRate,
    };

    // Check error rate
    checks.errorRate = {
      status: stats.apiStats.errorRate > this.alertThresholds.errorRate ? 'critical' : 'healthy',
      value: Math.round(stats.apiStats.errorRate),
      threshold: this.alertThresholds.errorRate,
    };

    // Determine overall status
    const hasCritical = Object.values(checks).some(check => check.status === 'critical');
    const hasWarning = Object.values(checks).some(check => check.status === 'warning');

    const status = hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy';

    return { status, checks };
  }

  // Clear old metrics to prevent memory leaks
  private cleanupMetrics() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  // Start background monitoring
  startMonitoring() {
    // Clean up metrics every hour
    setInterval(() => {
      this.cleanupMetrics();
    }, 60 * 60 * 1000);

    // Store system metrics every 5 minutes
    setInterval(async () => {
      const systemStats = {
        timestamp: Date.now(),
        data: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          performance: await this.getPerformanceStats(300000), // Last 5 minutes
        },
      };

      try {
        await prisma.systemMetrics.create({
          data: systemStats,
        });
      } catch (error) {
        logger.error('Failed to store system metrics:', error);
      }
    }, 5 * 60 * 1000);

    // Run health check every 10 minutes
    setInterval(async () => {
      const health = await this.healthCheck();
      if (health.status !== 'healthy') {
        await this.createAlert({
          type: 'SYSTEM_HEALTH',
          severity: health.status === 'critical' ? 'critical' : 'warning',
          message: `System health status: ${health.status}`,
          details: health.checks,
        });
      }
    }, 10 * 60 * 1000);

    logger.info('Performance monitoring started');
  }

  // Get real-time metrics for dashboard
  async getRealTimeMetrics() {
    const last5Min = await this.getPerformanceStats(300000);
    const health = await this.healthCheck();
    
    return {
      ...last5Min,
      health: health.status,
      healthDetails: health.checks,
      timestamp: Date.now(),
    };
  }

  // Get historical performance data
  async getHistoricalData(hours: number = 24) {
    try {
      const metrics = await prisma.systemMetrics.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - hours * 60 * 60 * 1000),
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100,
      });

      return metrics.map(m => ({
        timestamp: m.timestamp,
        ...m.data,
      }));
    } catch (error) {
      logger.error('Failed to fetch historical data:', error);
      return [];
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware for automatic API monitoring
export function withPerformanceMonitoring(handler: Function, endpoint: string) {
  return async (...args: any[]) => {
    const startTime = Date.now();
    let success = true;

    try {
      const result = await handler(...args);
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      await performanceMonitor.trackApiResponse(endpoint, duration, success);
    }
  };
}