import { getUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',

  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_ACTIVATED = 'USER_ACTIVATED',

  // Content
  POST_CREATED = 'POST_CREATED',
  POST_UPDATED = 'POST_UPDATED',
  POST_DELETED = 'POST_DELETED',
  POST_PUBLISHED = 'POST_PUBLISHED',
  POST_UNPUBLISHED = 'POST_UNPUBLISHED',

  // Comments
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED',
  COMMENT_APPROVED = 'COMMENT_APPROVED',
  COMMENT_REJECTED = 'COMMENT_REJECTED',

  // Newsletter
  NEWSLETTER_SENT = 'NEWSLETTER_SENT',
  NEWSLETTER_SCHEDULED = 'NEWSLETTER_SCHEDULED',
  SUBSCRIBER_ADDED = 'SUBSCRIBER_ADDED',
  SUBSCRIBER_REMOVED = 'SUBSCRIBER_REMOVED',

  // Security
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',

  // Subscription
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // System
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  CACHE_CLEARED = 'CACHE_CLEARED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE';
  message?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Get current user if not provided
      let userId = entry.userId;
      if (!userId) {
        try {
          const user = await getUserFromCookies();
          userId = user?.id;
        } catch {
          // Session might not be available in all contexts
        }
      }

      await prisma.auditLog.create({
        data: {
          action: entry.action,
          userId,
          targetId: entry.targetId,
          targetType: entry.targetType,
          metadata: entry.metadata || {},
          ip: entry.ip,
          userAgent: entry.userAgent,
          status: entry.status,
          message: entry.message,
        },
      });
    } catch (error) {
      // console.error('Failed to write audit log:', error);
      // Don't throw - audit logging should not break the application
    }
  }

  async logSuccess(action: AuditAction, details?: Partial<AuditLogEntry>): Promise<void> {
    await this.log({
      action,
      status: 'SUCCESS',
      ...details,
    });
  }

  async logFailure(
    action: AuditAction,
    message: string,
    details?: Partial<AuditLogEntry>,
  ): Promise<void> {
    await this.log({
      action,
      status: 'FAILURE',
      message,
      ...details,
    });
  }

  async getAuditLogs(options: {
    userId?: string;
    action?: AuditAction;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (options.userId) where.userId = options.userId;
    if (options.action) where.action = options.action;
    if (options.targetId) where.targetId = options.targetId;

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 100,
      skip: options.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    await this.logSuccess(AuditAction.SYSTEM_ERROR, {
      message: `Cleaned up ${result.count} old audit logs`,
      metadata: { daysToKeep, cutoffDate },
    });

    return result.count;
  }
}

export const auditLogger = AuditLogger.getInstance();
