import { NotificationService } from './notification-service';
import { prisma } from './prisma';

export class NotificationHooks {
  
  // Hook for new comments that need moderation
  static async onCommentCreated(commentId: string) {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          post: { select: { title: true, slug: true } },
          author: { select: { name: true, email: true } }
        }
      });

      if (!comment) return;

      // If comment needs moderation
      if (comment.status === 'PENDING') {
        await NotificationService.create({
          type: 'CONTENT_ALERT',
          category: 'MODERATION',
          title: 'New comment needs moderation',
          message: `New comment on "${comment.post.title}" by ${comment.author?.name || comment.authorName || 'Anonymous'}`,
          description: comment.body.length > 100 ? 
            comment.body.substring(0, 100) + '...' : 
            comment.body,
          actionUrl: `/admin/comments/moderation`,
          actionLabel: 'Review Comment',
          role: 'ADMIN',
          priority: 'NORMAL',
          sourceId: commentId,
          sourceType: 'comment',
          data: {
            postSlug: comment.post.slug,
            postTitle: comment.post.title,
            authorName: comment.author?.name || comment.authorName,
            commentPreview: comment.body.substring(0, 200)
          }
        });
      }

      // If AI detected spam
      if (comment.moderationStatus === 'spam') {
        await NotificationService.create({
          type: 'SECURITY_ALERT',
          category: 'MODERATION',
          title: 'Spam comment detected',
          message: `AI detected spam comment on "${comment.post.title}"`,
          description: `Confidence: ${comment.moderationScore ? Math.round(comment.moderationScore * 100) : 0}%`,
          actionUrl: `/admin/comments/moderation?filter=spam`,
          actionLabel: 'Review Spam',
          role: 'ADMIN',
          priority: 'HIGH',
          sourceId: commentId,
          sourceType: 'spam_comment',
          data: {
            moderationScore: comment.moderationScore,
            postTitle: comment.post.title,
            aiReason: comment.moderationReason
          },
          aiGenerated: true,
          generatedBy: 'comment_ai_moderator'
        });
      }

      // If AI detected toxic content
      if (comment.moderationStatus === 'toxic') {
        await NotificationService.create({
          type: 'SECURITY_ALERT',
          category: 'MODERATION',
          title: 'Toxic comment detected',
          message: `AI detected toxic content on "${comment.post.title}"`,
          description: `Immediate review required. Confidence: ${comment.moderationScore ? Math.round(comment.moderationScore * 100) : 0}%`,
          actionUrl: `/admin/comments/moderation?filter=toxic`,
          actionLabel: 'Review Content',
          role: 'ADMIN',
          priority: 'URGENT',
          sourceId: commentId,
          sourceType: 'toxic_comment',
          data: {
            moderationScore: comment.moderationScore,
            postTitle: comment.post.title,
            aiReason: comment.moderationReason
          },
          aiGenerated: true,
          generatedBy: 'toxicity_detector'
        });
      }

    } catch (error) {
      console.error('Error in comment notification hook:', error);
    }
  }

  // Hook for new posts
  static async onPostCreated(postId: string, authorId: string) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          author: { select: { name: true, role: true } },
          categories: { include: { category: true } }
        }
      });

      if (!post) return;

      // If post is by an editor (needs admin review)
      if (post.author.role === 'EDITOR' && post.status === 'DRAFT') {
        await NotificationService.create({
          type: 'CONTENT_ALERT',
          category: 'CONTENT_MANAGEMENT',
          title: 'New editor post needs review',
          message: `"${post.title}" by ${post.author.name} is ready for review`,
          description: post.excerpt || post.teaser || 'No description available',
          actionUrl: `/admin/posts/${postId}/edit`,
          actionLabel: 'Review Post',
          role: 'ADMIN',
          priority: 'NORMAL',
          sourceId: postId,
          sourceType: 'editor_post',
          data: {
            authorName: post.author.name,
            categories: post.categories.map(c => c.category.name)
          }
        });
      }

      // If post is published and trending
      if (post.status === 'PUBLISHED' && post.viewCount > 1000) {
        await NotificationService.create({
          type: 'SUCCESS',
          category: 'ANALYTICS',
          title: 'Post is trending!',
          message: `"${post.title}" has reached ${post.viewCount} views`,
          description: 'Consider promoting this content or creating follow-up posts',
          actionUrl: `/admin/analytics/article/${postId}`,
          actionLabel: 'View Analytics',
          role: 'ADMIN',
          priority: 'LOW',
          sourceId: postId,
          sourceType: 'trending_post',
          data: {
            viewCount: post.viewCount,
            categories: post.categories.map(c => c.category.name)
          },
          aiGenerated: true,
          generatedBy: 'trend_detector'
        });
      }

    } catch (error) {
      console.error('Error in post notification hook:', error);
    }
  }

  // Hook for system performance alerts
  static async onPerformanceIssue(type: string, details: any) {
    try {
      let priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL' = 'NORMAL';
      let title = '';
      let message = '';
      let actionUrl = '/admin/performance';

      switch (type) {
        case 'slow_query':
          priority = details.duration > 5000 ? 'HIGH' : 'NORMAL';
          title = `Slow database query detected`;
          message = `Query took ${Math.round(details.duration)}ms to execute`;
          break;

        case 'high_cpu':
          priority = details.usage > 90 ? 'CRITICAL' : details.usage > 80 ? 'HIGH' : 'NORMAL';
          title = `High CPU usage: ${details.usage}%`;
          message = `Server CPU usage is critically high`;
          break;

        case 'memory_leak':
          priority = 'HIGH';
          title = `Memory usage increasing`;
          message = `Memory usage: ${details.usage}MB (${details.percentage}%)`;
          break;

        case 'api_errors':
          priority = details.count > 20 ? 'URGENT' : 'HIGH';
          title = `${details.count} API errors in last hour`;
          message = `Multiple API endpoints returning errors`;
          actionUrl = '/admin/security';
          break;
      }

      await NotificationService.create({
        type: 'PERFORMANCE_ALERT',
        category: 'SYSTEM_HEALTH',
        title,
        message,
        description: `Performance issue detected: ${type}`,
        actionUrl,
        actionLabel: 'Investigate',
        role: 'ADMIN',
        priority,
        sourceType: 'performance_monitor',
        data: {
          performanceType: type,
          details,
          timestamp: new Date().toISOString()
        },
        aiGenerated: true,
        generatedBy: 'performance_monitor'
      });

    } catch (error) {
      console.error('Error in performance notification hook:', error);
    }
  }

  // Hook for security events
  static async onSecurityEvent(eventType: string, details: any) {
    try {
      let priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL' = 'NORMAL';
      let title = '';
      let message = '';

      switch (eventType) {
        case 'failed_login_attempts':
          priority = details.count > 10 ? 'URGENT' : 'HIGH';
          title = `${details.count} failed login attempts`;
          message = `Possible brute force attack from ${details.ipAddress || 'unknown IP'}`;
          break;

        case 'suspicious_activity':
          priority = 'HIGH';
          title = 'Suspicious user activity detected';
          message = `Unusual patterns detected for user ${details.userId || 'unknown'}`;
          break;

        case 'data_breach_attempt':
          priority = 'CRITICAL';
          title = 'Potential data breach attempt';
          message = 'Immediate attention required - security protocols activated';
          break;

        case 'malware_detected':
          priority = 'CRITICAL';
          title = 'Malware upload detected';
          message = `Malicious file upload blocked: ${details.filename}`;
          break;
      }

      await NotificationService.create({
        type: 'SECURITY_ALERT',
        category: 'SECURITY',
        title,
        message,
        description: `Security event: ${eventType}`,
        actionUrl: '/admin/security',
        actionLabel: 'Review Security',
        role: 'ADMIN',
        priority,
        sourceType: 'security_monitor',
        data: {
          eventType,
          details,
          timestamp: new Date().toISOString()
        },
        aiGenerated: true,
        generatedBy: 'security_monitor'
      });

    } catch (error) {
      console.error('Error in security notification hook:', error);
    }
  }

  // Hook for newsletter events
  static async onNewsletterEvent(eventType: string, campaignId: string, details: any) {
    try {
      const campaign = await prisma.newsletterCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) return;

      switch (eventType) {
        case 'campaign_sent':
          await NotificationService.create({
            type: 'SUCCESS',
            category: 'NEWSLETTER',
            title: 'Newsletter campaign sent successfully',
            message: `"${campaign.subject}" sent to ${details.recipientCount} subscribers`,
            actionUrl: `/admin/newsletter/campaigns/${campaignId}`,
            actionLabel: 'View Campaign',
            role: 'ADMIN',
            priority: 'LOW',
            sourceId: campaignId,
            sourceType: 'newsletter_campaign',
            data: {
              campaignSubject: campaign.subject,
              recipientCount: details.recipientCount
            }
          });
          break;

        case 'campaign_failed':
          await NotificationService.create({
            type: 'ERROR',
            category: 'NEWSLETTER',
            title: 'Newsletter campaign failed',
            message: `"${campaign.subject}" failed to send: ${details.error}`,
            actionUrl: `/admin/newsletter/campaigns/${campaignId}`,
            actionLabel: 'Fix Campaign',
            role: 'ADMIN',
            priority: 'HIGH',
            sourceId: campaignId,
            sourceType: 'newsletter_error',
            data: {
              campaignSubject: campaign.subject,
              error: details.error
            }
          });
          break;

        case 'high_unsubscribe_rate':
          await NotificationService.create({
            type: 'WARNING',
            category: 'NEWSLETTER',
            title: 'High unsubscribe rate detected',
            message: `"${campaign.subject}" has ${details.unsubscribeRate}% unsubscribe rate`,
            description: 'Consider reviewing content strategy and segmentation',
            actionUrl: `/admin/newsletter/analytics`,
            actionLabel: 'View Analytics',
            role: 'ADMIN',
            priority: 'NORMAL',
            sourceId: campaignId,
            sourceType: 'newsletter_analytics',
            data: {
              campaignSubject: campaign.subject,
              unsubscribeRate: details.unsubscribeRate
            },
            aiGenerated: true,
            generatedBy: 'newsletter_analyzer'
          });
          break;
      }

    } catch (error) {
      console.error('Error in newsletter notification hook:', error);
    }
  }

  // Hook for AI system events
  static async onAIEvent(eventType: string, details: any) {
    try {
      switch (eventType) {
        case 'provider_down':
          await NotificationService.create({
            type: 'SYSTEM_ALERT',
            category: 'AI_AUTOMATION',
            title: `AI provider ${details.provider} is down`,
            message: `Switching to backup provider. Some features may be limited.`,
            actionUrl: '/admin/ai/central',
            actionLabel: 'Check AI Status',
            role: 'ADMIN',
            priority: 'HIGH',
            sourceType: 'ai_provider_status',
            data: {
              provider: details.provider,
              backupProvider: details.backupProvider
            },
            aiGenerated: true,
            generatedBy: 'ai_monitor'
          });
          break;

        case 'quota_exceeded':
          await NotificationService.create({
            type: 'WARNING',
            category: 'AI_AUTOMATION',
            title: `AI quota exceeded for ${details.provider}`,
            message: `Monthly quota limit reached. Consider upgrading plan.`,
            actionUrl: '/admin/ai/central',
            actionLabel: 'Manage Quotas',
            role: 'ADMIN',
            priority: 'NORMAL',
            sourceType: 'ai_quota',
            data: {
              provider: details.provider,
              usage: details.usage,
              limit: details.limit
            },
            aiGenerated: true,
            generatedBy: 'quota_monitor'
          });
          break;

        case 'automation_success':
          // Only create notification for significant automations
          if (details.significance === 'high') {
            await NotificationService.create({
              type: 'SUCCESS',
              category: 'AI_AUTOMATION',
              title: `AI automation completed: ${details.taskName}`,
              message: `${details.description}`,
              actionUrl: details.actionUrl,
              actionLabel: 'View Results',
              role: 'ADMIN',
              priority: 'LOW',
              sourceType: 'ai_automation',
              data: details,
              aiGenerated: true,
              generatedBy: 'automation_system'
            });
          }
          break;
      }

    } catch (error) {
      console.error('Error in AI notification hook:', error);
    }
  }
}

// Export hook functions for easy integration
export const {
  onCommentCreated,
  onPostCreated,
  onPerformanceIssue,
  onSecurityEvent,
  onNewsletterEvent,
  onAIEvent
} = NotificationHooks;