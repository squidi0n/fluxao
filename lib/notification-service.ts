import { prisma } from '@/lib/prisma';
import { NotificationType, NotificationCategory, NotificationPriority, Role } from '@prisma/client';

export interface CreateNotificationData {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  description?: string;
  actionUrl?: string;
  actionLabel?: string;
  userId?: string;
  role?: Role;
  priority?: NotificationPriority;
  sourceId?: string;
  sourceType?: string;
  data?: any;
  scheduledFor?: Date;
  expiresAt?: Date;
  aiGenerated?: boolean;
  generatedBy?: string;
}

export class NotificationService {
  // Create a new notification
  static async create(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          ...data,
          priority: data.priority || 'NORMAL'
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // AI-Generated Notification Methods

  // Generate notifications for pending comment moderation
  static async generateModerationNotifications() {
    try {
      const pendingComments = await prisma.comment.count({
        where: {
          status: 'PENDING'
        }
      });

      const spamComments = await prisma.comment.count({
        where: {
          moderationStatus: 'spam'
        }
      });

      const toxicComments = await prisma.comment.count({
        where: {
          moderationStatus: 'toxic'
        }
      });

      // Only create notification if there are pending comments
      if (pendingComments > 0) {
        await this.create({
          type: 'CONTENT_ALERT',
          category: 'MODERATION',
          title: `${pendingComments} comments need moderation`,
          message: `You have ${pendingComments} comments waiting for review${spamComments > 0 ? ` (${spamComments} spam detected)` : ''}${toxicComments > 0 ? ` (${toxicComments} toxic content detected)` : ''}.`,
          description: `Review pending comments to maintain content quality and user experience.`,
          actionUrl: '/admin/comments/moderation',
          actionLabel: 'Review Comments',
          role: 'ADMIN',
          priority: pendingComments > 50 ? 'HIGH' : pendingComments > 20 ? 'NORMAL' : 'LOW',
          sourceType: 'comment_moderation',
          data: { 
            pendingComments, 
            spamComments, 
            toxicComments,
            generatedAt: new Date().toISOString()
          },
          aiGenerated: true,
          generatedBy: 'notification_service',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
      }

      return { pendingComments, spamComments, toxicComments };
    } catch (error) {
      console.error('Error generating moderation notifications:', error);
      throw error;
    }
  }

  // Generate system performance notifications
  static async generatePerformanceNotifications() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check for slow pages (analytics data)
      const slowPages = await prisma.userActivity.findMany({
        where: {
          createdAt: { gte: oneHourAgo },
          timeOnPage: { gt: 10000 } // More than 10 seconds
        },
        distinct: ['postId'],
        take: 10
      });

      // Check database query performance
      const recentErrors = await prisma.systemAlert.count({
        where: {
          type: 'error',
          timestamp: { gte: oneHourAgo },
          resolved: false
        }
      });

      if (slowPages.length > 5) {
        await this.create({
          type: 'PERFORMANCE_ALERT',
          category: 'SYSTEM_HEALTH',
          title: 'Slow page performance detected',
          message: `${slowPages.length} pages showing slow load times in the last hour.`,
          description: 'Some pages are taking longer than expected to load. Consider checking database queries and caching.',
          actionUrl: '/admin/performance',
          actionLabel: 'Check Performance',
          role: 'ADMIN',
          priority: 'HIGH',
          sourceType: 'performance_monitoring',
          data: { 
            slowPageCount: slowPages.length,
            timeframe: 'last_hour',
            generatedAt: new Date().toISOString()
          },
          aiGenerated: true,
          generatedBy: 'performance_monitor'
        });
      }

      if (recentErrors > 3) {
        await this.create({
          type: 'SYSTEM_ALERT',
          category: 'SYSTEM_HEALTH',
          title: `${recentErrors} system errors in the last hour`,
          message: 'Multiple system errors detected. Immediate attention required.',
          description: 'System errors can impact user experience and should be investigated promptly.',
          actionUrl: '/admin/security',
          actionLabel: 'View Errors',
          role: 'ADMIN',
          priority: 'URGENT',
          sourceType: 'error_monitoring',
          data: { 
            errorCount: recentErrors,
            timeframe: 'last_hour',
            generatedAt: new Date().toISOString()
          },
          aiGenerated: true,
          generatedBy: 'error_monitor'
        });
      }

      return { slowPages: slowPages.length, recentErrors };
    } catch (error) {
      console.error('Error generating performance notifications:', error);
      throw error;
    }
  }

  // Generate content recommendations
  static async generateContentNotifications() {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Check for trending topics
      const trendingPosts = await prisma.post.findMany({
        where: {
          publishedAt: { gte: oneWeekAgo },
          status: 'PUBLISHED'
        },
        orderBy: {
          viewCount: 'desc'
        },
        take: 5,
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      });

      // Check newsletter performance
      const recentNewsletters = await prisma.newsletterCampaign.count({
        where: {
          sentAt: { gte: oneWeekAgo },
          status: 'sent'
        }
      });

      // Check for posts needing attention
      const draftPosts = await prisma.post.count({
        where: {
          status: 'DRAFT',
          updatedAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      });

      if (trendingPosts.length > 0) {
        const topPost = trendingPosts[0];
        const categories = topPost.categories.map(c => c.category.name).join(', ');
        
        await this.create({
          type: 'AI_TASK',
          category: 'CONTENT_MANAGEMENT',
          title: `Trending content opportunity: "${topPost.title}"`,
          message: `Your post "${topPost.title}" is trending with ${topPost.viewCount} views. Consider creating follow-up content about ${categories}.`,
          description: 'Leverage trending content to increase engagement and grow your audience.',
          actionUrl: `/admin/posts/new`,
          actionLabel: 'Create Follow-up',
          role: 'ADMIN',
          priority: 'NORMAL',
          sourceId: topPost.id,
          sourceType: 'trending_content',
          data: { 
            postTitle: topPost.title,
            viewCount: topPost.viewCount,
            categories,
            generatedAt: new Date().toISOString()
          },
          aiGenerated: true,
          generatedBy: 'content_analyzer'
        });
      }

      if (draftPosts > 5) {
        await this.create({
          type: 'REMINDER',
          category: 'CONTENT_MANAGEMENT',
          title: `${draftPosts} draft posts need attention`,
          message: `You have ${draftPosts} draft posts that haven't been updated in over a week.`,
          description: 'Regularly reviewing and publishing draft content helps maintain a consistent publishing schedule.',
          actionUrl: '/admin/posts?status=draft',
          actionLabel: 'Review Drafts',
          role: 'ADMIN',
          priority: 'LOW',
          sourceType: 'draft_management',
          data: { 
            draftCount: draftPosts,
            generatedAt: new Date().toISOString()
          },
          aiGenerated: true,
          generatedBy: 'content_manager'
        });
      }

      return { trendingPosts: trendingPosts.length, draftPosts, recentNewsletters };
    } catch (error) {
      console.error('Error generating content notifications:', error);
      throw error;
    }
  }

  // Generate security notifications
  static async generateSecurityNotifications() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Check for failed login attempts
      const failedLogins = await prisma.securityEvent.count({
        where: {
          type: 'login_failed',
          createdAt: { gte: oneHourAgo }
        }
      });

      // Check for suspicious activity
      const suspiciousActivity = await prisma.securityEvent.count({
        where: {
          severity: 'critical',
          createdAt: { gte: oneHourAgo }
        }
      });

      if (failedLogins > 10) {
        await this.create({
          type: 'SECURITY_ALERT',
          category: 'SECURITY',
          title: `${failedLogins} failed login attempts in the last hour`,
          message: 'Multiple failed login attempts detected. Possible brute force attack.',
          description: 'Monitor security events and consider implementing additional security measures.',
          actionUrl: '/admin/security',
          actionLabel: 'View Security Events',
          role: 'ADMIN',
          priority: 'HIGH',
          sourceType: 'security_monitoring',
          data: { 
            failedLogins,
            timeframe: 'last_hour',
            generatedAt: new Date().toISOString()
          },
          aiGenerated: true,
          generatedBy: 'security_monitor'
        });
      }

      if (suspiciousActivity > 0) {
        await this.create({
          type: 'SECURITY_ALERT',
          category: 'SECURITY',
          title: 'Critical security events detected',
          message: `${suspiciousActivity} critical security events require immediate attention.`,
          description: 'Critical security events should be investigated immediately to protect system integrity.',
          actionUrl: '/admin/security',
          actionLabel: 'Investigate Now',
          role: 'ADMIN',
          priority: 'CRITICAL',
          sourceType: 'security_monitoring',
          data: { 
            suspiciousActivity,
            timeframe: 'last_hour',
            generatedAt: new Date().toISOString()
          },
          aiGenerated: true,
          generatedBy: 'security_monitor'
        });
      }

      return { failedLogins, suspiciousActivity };
    } catch (error) {
      console.error('Error generating security notifications:', error);
      throw error;
    }
  }

  // Generate AI automation notifications
  static async generateAINotifications() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Check AI task failures
      const failedTasks = await prisma.aITaskLog.count({
        where: {
          success: false,
          createdAt: { gte: oneHourAgo }
        }
      });

      // Check AI provider availability
      const unavailableProviders = await prisma.aIProvider.count({
        where: {
          isAvailable: false,
          isActive: true
        }
      });

      if (failedTasks > 5) {
        await this.create({
          type: 'AI_TASK',
          category: 'AI_AUTOMATION',
          title: `${failedTasks} AI tasks failed in the last hour`,
          message: 'Multiple AI tasks are failing. Check provider status and configurations.',
          description: 'AI task failures can impact automated content generation and moderation.',
          actionUrl: '/admin/ai/central',
          actionLabel: 'Check AI Status',
          role: 'ADMIN',
          priority: 'HIGH',
          sourceType: 'ai_monitoring',
          data: { 
            failedTasks,
            timeframe: 'last_hour',
            generatedAt: new Date().toISOString()
          },
          aiGenerated: true,
          generatedBy: 'ai_monitor'
        });
      }

      if (unavailableProviders > 0) {
        await this.create({
          type: 'SYSTEM_ALERT',
          category: 'AI_AUTOMATION',
          title: `${unavailableProviders} AI providers unavailable`,
          message: 'Some AI providers are currently unavailable. System may fall back to alternatives.',
          description: 'Monitor AI provider status to ensure optimal performance.',
          actionUrl: '/admin/ai/central',
          actionLabel: 'Check Providers',
          role: 'ADMIN',
          priority: 'NORMAL',
          sourceType: 'ai_provider_monitoring',
          data: { 
            unavailableProviders,
            generatedAt: new Date().toISOString()
          },
          aiGenerated: true,
          generatedBy: 'ai_provider_monitor'
        });
      }

      return { failedTasks, unavailableProviders };
    } catch (error) {
      console.error('Error generating AI notifications:', error);
      throw error;
    }
  }

  // Generate all notifications (called by cron job)
  static async generateAllNotifications() {
    try {
      console.log('🔔 Generating AI notifications...');
      
      const results = await Promise.allSettled([
        this.generateModerationNotifications(),
        this.generatePerformanceNotifications(),
        this.generateContentNotifications(),
        this.generateSecurityNotifications(),
        this.generateAINotifications()
      ]);

      const summary = {
        moderation: results[0].status === 'fulfilled' ? results[0].value : null,
        performance: results[1].status === 'fulfilled' ? results[1].value : null,
        content: results[2].status === 'fulfilled' ? results[2].value : null,
        security: results[3].status === 'fulfilled' ? results[3].value : null,
        ai: results[4].status === 'fulfilled' ? results[4].value : null,
        errors: results.filter(r => r.status === 'rejected').map(r => (r as any).reason)
      };

      console.log('✅ Notification generation complete:', summary);
      return summary;
      
    } catch (error) {
      console.error('Error in generateAllNotifications:', error);
      throw error;
    }
  }

  // Clean up old notifications
  static async cleanupNotifications() {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Delete expired notifications
      const expiredDeleted = await prisma.notification.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      // Delete old read notifications
      const oldReadDeleted = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          readAt: { lt: oneWeekAgo }
        }
      });

      // Archive old dismissed notifications
      const archivedDismissed = await prisma.notification.updateMany({
        where: {
          isDismissed: true,
          createdAt: { lt: oneWeekAgo },
          isArchived: false
        },
        data: {
          isArchived: true
        }
      });

      // Delete very old archived notifications
      const veryOldDeleted = await prisma.notification.deleteMany({
        where: {
          isArchived: true,
          createdAt: { lt: oneMonthAgo }
        }
      });

      return {
        expiredDeleted: expiredDeleted.count,
        oldReadDeleted: oldReadDeleted.count,
        archivedDismissed: archivedDismissed.count,
        veryOldDeleted: veryOldDeleted.count
      };

    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }

  // Get notification counts for admin
  static async getCounts(userId: string) {
    try {
      const [total, unread, high, critical] = await Promise.all([
        prisma.notification.count({
          where: {
            OR: [
              { userId },
              { userId: null, role: 'ADMIN' },
              { userId: null, role: null }
            ],
            isArchived: false,
            isDismissed: false
          }
        }),
        
        prisma.notification.count({
          where: {
            OR: [
              { userId },
              { userId: null, role: 'ADMIN' },
              { userId: null, role: null }
            ],
            isRead: false,
            isArchived: false,
            isDismissed: false
          }
        }),

        prisma.notification.count({
          where: {
            OR: [
              { userId },
              { userId: null, role: 'ADMIN' },
              { userId: null, role: null }
            ],
            priority: 'HIGH',
            isRead: false,
            isArchived: false,
            isDismissed: false
          }
        }),

        prisma.notification.count({
          where: {
            OR: [
              { userId },
              { userId: null, role: 'ADMIN' },
              { userId: null, role: null }
            ],
            priority: { in: ['URGENT', 'CRITICAL'] },
            isRead: false,
            isArchived: false,
            isDismissed: false
          }
        })
      ]);

      return { total, unread, high, critical };
    } catch (error) {
      console.error('Error getting notification counts:', error);
      throw error;
    }
  }
}