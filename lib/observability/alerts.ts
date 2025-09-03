import { observabilityLogger } from './logger';
import { metrics } from './metrics';
import { prisma } from '@/lib/prisma';

// Alert severity levels
export enum AlertSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5,
}

// Alert categories
export enum AlertCategory {
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  CONTENT = 'content',
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

// Alert interface
export interface Alert {
  id: string;
  type: string;
  category: AlertCategory;
  severity: AlertSeverity;
  message: string;
  details: Record<string, any>;
  resolved: boolean;
  timestamp: Date;
}

// Alert rule interface
export interface AlertRule {
  id: string;
  name: string;
  condition: (context: AlertContext) => boolean;
  severity: AlertSeverity;
  category: AlertCategory;
  message: (context: AlertContext) => string;
  cooldown?: number; // Minimum time between alerts in ms
  enabled: boolean;
}

// Context passed to alert rules
export interface AlertContext {
  metrics: any[];
  systemInfo: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    cpuUsage?: NodeJS.CpuUsage;
  };
  recentErrors: any[];
  activeRequests: number;
  responseTime: number;
  timestamp: Date;
}

// Alert manager class
export class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private lastAlerted: Map<string, number> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default alert rules
  private initializeDefaultRules() {
    // High memory usage alert
    this.addRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      condition: (ctx) => {
        const heapUsed = ctx.systemInfo.memoryUsage.heapUsed;
        const heapTotal = ctx.systemInfo.memoryUsage.heapTotal;
        return (heapUsed / heapTotal) > 0.8; // 80% threshold
      },
      severity: AlertSeverity.HIGH,
      category: AlertCategory.PERFORMANCE,
      message: (ctx) => {
        const usage = ((ctx.systemInfo.memoryUsage.heapUsed / ctx.systemInfo.memoryUsage.heapTotal) * 100).toFixed(1);
        return `Memory usage is at ${usage}% of heap limit`;
      },
      cooldown: 300000, // 5 minutes
      enabled: true,
    });

    // High response time alert
    this.addRule({
      id: 'high-response-time',
      name: 'High Response Time',
      condition: (ctx) => ctx.responseTime > 2000, // 2 seconds
      severity: AlertSeverity.MEDIUM,
      category: AlertCategory.PERFORMANCE,
      message: (ctx) => `Average response time is ${ctx.responseTime.toFixed(0)}ms`,
      cooldown: 180000, // 3 minutes
      enabled: true,
    });

    // Error rate alert
    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: (ctx) => {
        const errorMetrics = ctx.metrics.filter(m => 
          m.name === 'http_errors_total' && 
          m.timestamp > Date.now() - 300000 // Last 5 minutes
        );
        const totalErrorCount = errorMetrics.reduce((sum, m) => sum + m.value, 0);
        return totalErrorCount > 10; // More than 10 errors in 5 minutes
      },
      severity: AlertSeverity.HIGH,
      category: AlertCategory.SYSTEM,
      message: (ctx) => {
        const errorCount = ctx.metrics
          .filter(m => m.name === 'http_errors_total')
          .reduce((sum, m) => sum + m.value, 0);
        return `High error rate detected: ${errorCount} errors in the last 5 minutes`;
      },
      cooldown: 300000, // 5 minutes
      enabled: true,
    });

    // Database connection alert
    this.addRule({
      id: 'database-slow',
      name: 'Slow Database Queries',
      condition: (ctx) => {
        const dbMetrics = ctx.metrics.filter(m => 
          m.name.includes('db_query_duration') && 
          m.value > 5 // More than 5 seconds
        );
        return dbMetrics.length > 0;
      },
      severity: AlertSeverity.MEDIUM,
      category: AlertCategory.PERFORMANCE,
      message: () => 'Database queries are taking longer than expected',
      cooldown: 600000, // 10 minutes
      enabled: true,
    });

    // AI service failure alert
    this.addRule({
      id: 'ai-service-failure',
      name: 'AI Service Failure',
      condition: (ctx) => {
        const aiErrors = ctx.metrics.filter(m => 
          m.name === 'ai_errors_total' &&
          m.timestamp > Date.now() - 300000 // Last 5 minutes
        );
        return aiErrors.some(m => m.value > 3); // More than 3 AI errors
      },
      severity: AlertSeverity.HIGH,
      category: AlertCategory.AI,
      message: () => 'AI services are experiencing failures',
      cooldown: 300000, // 5 minutes
      enabled: true,
    });

    // Security alert for failed logins
    this.addRule({
      id: 'failed-logins',
      name: 'Multiple Failed Login Attempts',
      condition: (ctx) => {
        // This would check security events from the database
        return ctx.recentErrors.some(e => 
          e.type === 'AUTH_FAILED' && 
          e.count > 5 // More than 5 failed attempts
        );
      },
      severity: AlertSeverity.URGENT,
      category: AlertCategory.SECURITY,
      message: (ctx) => {
        const failedAttempts = ctx.recentErrors
          .filter(e => e.type === 'AUTH_FAILED')
          .reduce((sum, e) => sum + e.count, 0);
        return `${failedAttempts} failed login attempts detected`;
      },
      cooldown: 180000, // 3 minutes
      enabled: true,
    });

    // Content moderation backlog alert
    this.addRule({
      id: 'moderation-backlog',
      name: 'Comment Moderation Backlog',
      condition: (ctx) => {
        // This would check pending comments count
        return ctx.metrics.some(m => 
          m.name === 'pending_comments' && m.value > 50
        );
      },
      severity: AlertSeverity.MEDIUM,
      category: AlertCategory.CONTENT,
      message: (ctx) => {
        const backlog = ctx.metrics
          .find(m => m.name === 'pending_comments')?.value || 0;
        return `${backlog} comments awaiting moderation`;
      },
      cooldown: 1800000, // 30 minutes
      enabled: true,
    });
  }

  // Add a new alert rule
  addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
    observabilityLogger.info('Alert rule added', { ruleId: rule.id, name: rule.name });
  }

  // Remove an alert rule
  removeRule(ruleId: string) {
    if (this.rules.delete(ruleId)) {
      observabilityLogger.info('Alert rule removed', { ruleId });
    }
  }

  // Enable/disable a rule
  toggleRule(ruleId: string, enabled: boolean) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      observabilityLogger.info('Alert rule toggled', { ruleId, enabled });
    }
  }

  // Check all alert rules
  async checkAlerts(): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    try {
      // Gather context data
      const context = await this.gatherAlertContext();

      // Check each enabled rule
      for (const [ruleId, rule] of this.rules.entries()) {
        if (!rule.enabled) continue;

        // Check cooldown
        const lastAlert = this.lastAlerted.get(ruleId) || 0;
        const cooldown = rule.cooldown || 60000; // Default 1 minute
        if (Date.now() - lastAlert < cooldown) continue;

        try {
          // Evaluate rule condition
          if (rule.condition(context)) {
            const alert: Alert = {
              id: `${ruleId}-${Date.now()}`,
              type: rule.id,
              category: rule.category,
              severity: rule.severity,
              message: rule.message(context),
              details: {
                rule: rule.name,
                context: this.sanitizeContext(context),
              },
              resolved: false,
              timestamp: new Date(),
            };

            triggeredAlerts.push(alert);
            this.lastAlerted.set(ruleId, Date.now());

            // Log the alert
            observabilityLogger.warn('Alert triggered', {
              alertId: alert.id,
              rule: rule.name,
              severity: AlertSeverity[rule.severity],
              message: alert.message,
            });

            // Store alert in database
            await this.storeAlert(alert);

            // Send notifications if needed
            await this.sendNotifications(alert);
          }
        } catch (error) {
          observabilityLogger.error('Error checking alert rule', error, { ruleId });
        }
      }
    } catch (error) {
      observabilityLogger.error('Error checking alerts', error);
    }

    return triggeredAlerts;
  }

  // Gather context for alert evaluation
  private async gatherAlertContext(): Promise<AlertContext> {
    // Get current metrics
    const currentMetrics = metrics.getAllMetrics();

    // Get system info
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Get recent errors (would be implemented with actual error tracking)
    const recentErrors: any[] = [];

    // Calculate average response time from metrics
    const responseTimeMetrics = currentMetrics.filter(m => 
      m.name.includes('request_duration')
    );
    const avgResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length * 1000
      : 0;

    return {
      metrics: currentMetrics,
      systemInfo: {
        memoryUsage,
        uptime,
      },
      recentErrors,
      activeRequests: 0, // Would be tracked by middleware
      responseTime: avgResponseTime,
      timestamp: new Date(),
    };
  }

  // Sanitize context for storage (remove sensitive data)
  private sanitizeContext(context: AlertContext): any {
    return {
      metricCount: context.metrics.length,
      memoryUsageMB: Math.round(context.systemInfo.memoryUsage.heapUsed / 1024 / 1024),
      uptime: context.systemInfo.uptime,
      responseTime: context.responseTime,
      timestamp: context.timestamp,
    };
  }

  // Store alert in database
  private async storeAlert(alert: Alert) {
    try {
      await prisma.systemAlert.create({
        data: {
          alertId: alert.id,
          type: alert.category,
          category: alert.category,
          message: alert.message,
          details: alert.details,
          severity: alert.severity,
          resolved: alert.resolved,
          timestamp: alert.timestamp,
        },
      });
    } catch (error) {
      observabilityLogger.error('Failed to store alert', error);
    }
  }

  // Send notifications for critical alerts
  private async sendNotifications(alert: Alert) {
    if (alert.severity >= AlertSeverity.HIGH) {
      // In a real implementation, this would:
      // - Send email notifications
      // - Send Slack/Discord notifications
      // - Create tickets in issue tracking systems
      // - Send SMS for critical alerts
      
      observabilityLogger.info('High-priority alert notification sent', {
        alertId: alert.id,
        severity: AlertSeverity[alert.severity],
      });
    }
  }

  // Start automatic alert checking
  startMonitoring(intervalMs = 60000) { // Default 1 minute
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkAlerts().catch(error => {
        observabilityLogger.error('Error in alert monitoring', error);
      });
    }, intervalMs);

    observabilityLogger.info('Alert monitoring started', { intervalMs });
  }

  // Stop automatic alert checking
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      observabilityLogger.info('Alert monitoring stopped');
    }
  }

  // Get all rules
  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // Get recent alerts from database
  async getRecentAlerts(limit = 50): Promise<any[]> {
    try {
      return await prisma.systemAlert.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error) {
      observabilityLogger.error('Failed to get recent alerts', error);
      return [];
    }
  }

  // Resolve an alert
  async resolveAlert(alertId: string, resolvedBy: string) {
    try {
      await prisma.systemAlert.updateMany({
        where: { alertId },
        data: { 
          resolved: true, 
          resolvedAt: new Date(),
          resolvedBy,
        },
      });

      observabilityLogger.info('Alert resolved', { alertId, resolvedBy });
    } catch (error) {
      observabilityLogger.error('Failed to resolve alert', error);
    }
  }
}

// Global alert manager instance
export const alertManager = new AlertManager();

// Start monitoring when module is imported
if (process.env.NODE_ENV !== 'test') {
  alertManager.startMonitoring();
}

export default alertManager;