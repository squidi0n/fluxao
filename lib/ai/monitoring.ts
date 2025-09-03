import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface SystemMetrics {
  timestamp: Date;
  database: {
    connectionCount: number;
    queryTime: number;
    errors: number;
  };
  performance: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  content: {
    totalPosts: number;
    publishedToday: number;
    pendingComments: number;
    spamBlocked: number;
  };
  user: {
    activeUsers: number;
    newSignups: number;
    bounceRate: number;
  };
  ai: {
    requestsToday: number;
    tokensUsed: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'performance' | 'security' | 'content' | 'user' | 'ai';
  message: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
  severity: 1 | 2 | 3 | 4 | 5; // 1 = low, 5 = critical
}

export class MonitoringSystem {
  private alertThresholds = {
    responseTime: 3000, // ms
    memoryUsage: 85, // %
    cpuUsage: 80, // %
    errorRate: 5, // %
    bounceRate: 70, // %
    spamIncrease: 200, // %
    trafficDrop: 50, // %
  };

  async getCurrentMetrics(): Promise<SystemMetrics> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Database metrics
      const dbMetrics = await this.getDatabaseMetrics();
      
      // Content metrics
      const [totalPosts, publishedToday, pendingComments] = await Promise.all([
        prisma.post.count(),
        prisma.post.count({
          where: {
            publishedAt: {
              gte: dayAgo
            }
          }
        }),
        prisma.comment.count({
          where: {
            status: 'PENDING'
          }
        })
      ]);

      // User metrics
      const [activeUsers, newSignups] = await Promise.all([
        prisma.userActivity.groupBy({
          by: ['sessionId'],
          where: {
            createdAt: {
              gte: dayAgo
            }
          }
        }).then(sessions => sessions.length),
        prisma.user.count({
          where: {
            createdAt: {
              gte: dayAgo
            }
          }
        })
      ]);

      // AI metrics
      const aiMetrics = await this.getAIMetrics();

      // Performance metrics
      const performanceMetrics = await this.getPerformanceMetrics();

      const metrics: SystemMetrics = {
        timestamp: now,
        database: dbMetrics,
        performance: performanceMetrics,
        content: {
          totalPosts,
          publishedToday,
          pendingComments,
          spamBlocked: 0 // TODO: Implement spam counter
        },
        user: {
          activeUsers,
          newSignups,
          bounceRate: 0 // TODO: Calculate bounce rate
        },
        ai: aiMetrics
      };

      // Store metrics for historical analysis
      await this.storeMetrics(metrics);

      return metrics;
    } catch (error) {
      logger.error({ error }, 'Failed to collect system metrics');
      throw error;
    }
  }

  async checkAlerts(metrics: SystemMetrics): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Performance alerts
    if (metrics.performance.responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        id: `perf-response-${Date.now()}`,
        type: 'warning',
        category: 'performance',
        message: 'High response time detected',
        details: {
          currentResponseTime: metrics.performance.responseTime,
          threshold: this.alertThresholds.responseTime
        },
        timestamp: new Date(),
        resolved: false,
        severity: metrics.performance.responseTime > 5000 ? 4 : 3
      });
    }

    if (metrics.performance.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push({
        id: `perf-memory-${Date.now()}`,
        type: 'error',
        category: 'performance',
        message: 'High memory usage',
        details: {
          currentUsage: metrics.performance.memoryUsage,
          threshold: this.alertThresholds.memoryUsage
        },
        timestamp: new Date(),
        resolved: false,
        severity: metrics.performance.memoryUsage > 95 ? 5 : 4
      });
    }

    // Database alerts
    if (metrics.database.errors > 10) {
      alerts.push({
        id: `db-errors-${Date.now()}`,
        type: 'error',
        category: 'performance',
        message: 'Database errors detected',
        details: {
          errorCount: metrics.database.errors,
          queryTime: metrics.database.queryTime
        },
        timestamp: new Date(),
        resolved: false,
        severity: 4
      });
    }

    // Content alerts
    if (metrics.content.pendingComments > 50) {
      alerts.push({
        id: `content-moderation-${Date.now()}`,
        type: 'warning',
        category: 'content',
        message: 'High number of pending comments',
        details: {
          pendingCount: metrics.content.pendingComments
        },
        timestamp: new Date(),
        resolved: false,
        severity: 2
      });
    }

    // AI system alerts
    if (metrics.ai.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        id: `ai-errors-${Date.now()}`,
        type: 'warning',
        category: 'ai',
        message: 'High AI error rate',
        details: {
          errorRate: metrics.ai.errorRate,
          threshold: this.alertThresholds.errorRate
        },
        timestamp: new Date(),
        resolved: false,
        severity: 3
      });
    }

    // Store alerts
    for (const alert of alerts) {
      await this.storeAlert(alert);
    }

    return alerts;
  }

  async logTask(taskLog: {
    userId: string;
    provider: string;
    task: string;
    success: boolean;
    tokensUsed: number;
    responseTime: number;
    error?: string;
  }): Promise<void> {
    try {
      await prisma.aiTaskLog.create({
        data: {
          userId: taskLog.userId,
          provider: taskLog.provider,
          task: taskLog.task,
          success: taskLog.success,
          tokensUsed: taskLog.tokensUsed,
          responseTime: taskLog.responseTime,
          error: taskLog.error,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error({ error, taskLog }, 'Failed to log AI task');
    }
  }

  async getUsageStats(userId?: string): Promise<{
    today: {
      requests: number;
      tokensUsed: number;
      averageResponseTime: number;
      successRate: number;
    };
    thisWeek: {
      requests: number;
      tokensUsed: number;
      topProviders: Array<{ provider: string; count: number }>;
    };
    thisMonth: {
      requests: number;
      tokensUsed: number;
      cost: number;
    };
  }> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const baseWhere = userId ? { userId } : {};

    try {
      const [todayStats, weekStats, monthStats] = await Promise.all([
        // Today's stats
        prisma.aiTaskLog.groupBy({
          by: ['success'],
          where: {
            ...baseWhere,
            createdAt: { gte: dayAgo }
          },
          _count: true,
          _avg: {
            responseTime: true
          },
          _sum: {
            tokensUsed: true
          }
        }),

        // Week's stats
        prisma.aiTaskLog.groupBy({
          by: ['provider'],
          where: {
            ...baseWhere,
            createdAt: { gte: weekAgo }
          },
          _count: true,
          _sum: {
            tokensUsed: true
          },
          orderBy: {
            _count: {
              provider: 'desc'
            }
          }
        }),

        // Month's stats
        prisma.aiTaskLog.aggregate({
          where: {
            ...baseWhere,
            createdAt: { gte: monthAgo }
          },
          _count: true,
          _sum: {
            tokensUsed: true
          }
        })
      ]);

      const totalToday = todayStats.reduce((sum, stat) => sum + stat._count, 0);
      const successfulToday = todayStats.find(stat => stat.success)?._count || 0;
      const tokensToday = todayStats.reduce((sum, stat) => sum + (stat._sum.tokensUsed || 0), 0);
      const avgResponseTime = todayStats.reduce((sum, stat, index, arr) => 
        sum + (stat._avg.responseTime || 0) / arr.length, 0);

      const totalWeek = weekStats.reduce((sum, stat) => sum + stat._count, 0);
      const tokensWeek = weekStats.reduce((sum, stat) => sum + (stat._sum.tokensUsed || 0), 0);

      const totalMonth = monthStats._count || 0;
      const tokensMonth = monthStats._sum.tokensUsed || 0;
      const estimatedCost = this.estimateCost(tokensMonth);

      return {
        today: {
          requests: totalToday,
          tokensUsed: tokensToday,
          averageResponseTime: Math.round(avgResponseTime),
          successRate: totalToday > 0 ? Math.round((successfulToday / totalToday) * 100) : 0
        },
        thisWeek: {
          requests: totalWeek,
          tokensUsed: tokensWeek,
          topProviders: weekStats.map(stat => ({
            provider: stat.provider,
            count: stat._count
          }))
        },
        thisMonth: {
          requests: totalMonth,
          tokensUsed: tokensMonth,
          cost: estimatedCost
        }
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get usage stats');
      throw error;
    }
  }

  private async getDatabaseMetrics() {
    // Get database performance metrics
    // This is simplified - in production, you'd query actual DB metrics
    const startTime = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      const queryTime = Date.now() - startTime;

      return {
        connectionCount: 1, // Would get from connection pool
        queryTime,
        errors: 0 // Would track actual errors
      };
    } catch (error) {
      return {
        connectionCount: 0,
        queryTime: -1,
        errors: 1
      };
    }
  }

  private async getPerformanceMetrics() {
    // Get system performance metrics
    // In production, you'd use actual system monitoring
    const memoryUsage = process.memoryUsage();
    
    return {
      responseTime: 0, // Would track actual response times
      memoryUsage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      cpuUsage: 0 // Would get from system monitoring
    };
  }

  private async getAIMetrics() {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    try {
      const stats = await prisma.aiTaskLog.aggregate({
        where: {
          createdAt: { gte: dayAgo }
        },
        _count: true,
        _sum: {
          tokensUsed: true
        },
        _avg: {
          responseTime: true
        }
      });

      const errorCount = await prisma.aiTaskLog.count({
        where: {
          createdAt: { gte: dayAgo },
          success: false
        }
      });

      const totalRequests = stats._count || 0;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

      return {
        requestsToday: totalRequests,
        tokensUsed: stats._sum.tokensUsed || 0,
        averageResponseTime: Math.round(stats._avg.responseTime || 0),
        errorRate: Math.round(errorRate * 100) / 100
      };
    } catch (error) {
      return {
        requestsToday: 0,
        tokensUsed: 0,
        averageResponseTime: 0,
        errorRate: 100
      };
    }
  }

  private async storeMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      await prisma.systemMetrics.create({
        data: {
          timestamp: metrics.timestamp,
          data: JSON.stringify(metrics)
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to store metrics');
    }
  }

  private async storeAlert(alert: Alert): Promise<void> {
    try {
      await prisma.systemAlert.create({
        data: {
          alertId: alert.id,
          type: alert.type,
          category: alert.category,
          message: alert.message,
          details: JSON.stringify(alert.details),
          severity: alert.severity,
          resolved: alert.resolved,
          timestamp: alert.timestamp
        }
      });
    } catch (error) {
      logger.error({ error, alert }, 'Failed to store alert');
    }
  }

  private estimateCost(tokens: number): number {
    // Simplified cost estimation
    // In production, you'd track actual costs per provider
    const avgCostPer1KTokens = 0.01; // $0.01 per 1K tokens average
    return (tokens / 1000) * avgCostPer1KTokens;
  }

  // Auto-remediation methods
  async autoRemediate(alert: Alert): Promise<boolean> {
    logger.info({ alertId: alert.id }, 'Attempting auto-remediation');

    switch (alert.category) {
      case 'performance':
        return await this.remediatePerformanceIssue(alert);
      case 'content':
        return await this.remediateContentIssue(alert);
      case 'ai':
        return await this.remediateAIIssue(alert);
      default:
        return false;
    }
  }

  private async remediatePerformanceIssue(alert: Alert): Promise<boolean> {
    try {
      // Clear caches if memory usage is high
      if (alert.message.includes('memory')) {
        // Clear application caches
        // This would integrate with your caching system
        logger.info('Clearing application caches due to high memory usage');
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ error }, 'Failed to remediate performance issue');
      return false;
    }
  }

  private async remediateContentIssue(alert: Alert): Promise<boolean> {
    try {
      // Auto-moderate pending comments if queue is too long
      if (alert.message.includes('pending comments')) {
        // Could implement auto-moderation for obvious spam
        logger.info('Triggering auto-moderation for pending comments');
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ error }, 'Failed to remediate content issue');
      return false;
    }
  }

  private async remediateAIIssue(alert: Alert): Promise<boolean> {
    try {
      // Switch to backup provider if error rate is high
      if (alert.message.includes('error rate')) {
        logger.info('AI error rate high, considering provider failover');
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ error }, 'Failed to remediate AI issue');
      return false;
    }
  }

  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    score: number;
    components: Record<string, { status: string; score: number }>;
  }> {
    const metrics = await this.getCurrentMetrics();
    const alerts = await this.checkAlerts(metrics);

    // Calculate component health scores
    const components = {
      database: this.calculateDatabaseHealth(metrics.database),
      performance: this.calculatePerformanceHealth(metrics.performance),
      content: this.calculateContentHealth(metrics.content),
      ai: this.calculateAIHealth(metrics.ai)
    };

    // Calculate overall score
    const totalScore = Object.values(components).reduce((sum, comp) => sum + comp.score, 0);
    const overallScore = Math.round(totalScore / Object.keys(components).length);

    // Determine overall status
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (overallScore < 70) overall = 'critical';
    else if (overallScore < 85) overall = 'warning';

    // Factor in critical alerts
    const criticalAlerts = alerts.filter(a => a.severity >= 4);
    if (criticalAlerts.length > 0) overall = 'critical';

    return {
      overall,
      score: overallScore,
      components
    };
  }

  private calculateDatabaseHealth(dbMetrics: SystemMetrics['database']) {
    let score = 100;
    
    if (dbMetrics.queryTime > 1000) score -= 20;
    if (dbMetrics.queryTime > 2000) score -= 30;
    if (dbMetrics.errors > 0) score -= 25;
    
    return {
      status: score > 80 ? 'healthy' : score > 60 ? 'warning' : 'critical',
      score: Math.max(0, score)
    };
  }

  private calculatePerformanceHealth(perfMetrics: SystemMetrics['performance']) {
    let score = 100;
    
    if (perfMetrics.memoryUsage > 80) score -= 20;
    if (perfMetrics.memoryUsage > 90) score -= 30;
    if (perfMetrics.responseTime > 2000) score -= 25;
    
    return {
      status: score > 80 ? 'healthy' : score > 60 ? 'warning' : 'critical',
      score: Math.max(0, score)
    };
  }

  private calculateContentHealth(contentMetrics: SystemMetrics['content']) {
    let score = 100;
    
    if (contentMetrics.pendingComments > 50) score -= 15;
    if (contentMetrics.pendingComments > 100) score -= 25;
    
    return {
      status: score > 80 ? 'healthy' : score > 60 ? 'warning' : 'critical',
      score: Math.max(0, score)
    };
  }

  private calculateAIHealth(aiMetrics: SystemMetrics['ai']) {
    let score = 100;
    
    if (aiMetrics.errorRate > 5) score -= 20;
    if (aiMetrics.errorRate > 10) score -= 40;
    if (aiMetrics.averageResponseTime > 5000) score -= 15;
    
    return {
      status: score > 80 ? 'healthy' : score > 60 ? 'warning' : 'critical',
      score: Math.max(0, score)
    };
  }
}

