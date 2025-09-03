import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { addAIJob, getJobStatus, getQueueStats } from '@/server/queue/ai-jobs';
import {
  performContentAudit,
  generateUserEngagementInsights,
  generateModerationReport,
  generateContentStrategy,
  generateAdminAlerts,
  batchProcessAdminTasks,
} from '@/lib/ai/admin-tools';
import {
  generateAnalyticsInsights,
  analyzeContentPerformance,
  analyzeUserBehavior,
  generatePredictiveInsights,
  analyzeCompetition,
  generateAutomatedReport,
} from '@/lib/ai/analytics';
import { getUsageStats, isAIEnabled } from '@/lib/ai/budget';

// Request schemas
const ContentAuditSchema = z.object({
  options: z.object({
    includeUnpublished: z.boolean().default(false),
    focusAreas: z.array(z.enum(['SEO', 'QUALITY', 'STRUCTURE', 'READABILITY', 'TECHNICAL'])).optional(),
    timeframe: z.enum(['week', 'month', 'quarter', 'all']).default('month'),
    minScore: z.number().min(0).max(100).default(0),
  }).optional(),
  async: z.boolean().optional(),
});

const EngagementInsightsSchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter']).default('month'),
  async: z.boolean().optional(),
});

const ModerationReportSchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter']).default('month'),
  async: z.boolean().optional(),
});

const ContentStrategySchema = z.object({
  businessGoals: z.array(z.string()),
  includeCompetitorAnalysis: z.boolean().default(false),
  async: z.boolean().optional(),
});

const AnalyticsInsightsSchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter']).default('month'),
  async: z.boolean().optional(),
});

const AutomatedReportSchema = z.object({
  reportType: z.enum(['weekly', 'monthly', 'quarterly']),
  async: z.boolean().optional(),
});

/**
 * POST /api/ai/admin - Execute admin AI tasks
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const body = await request.json();

    switch (action) {
      case 'content-audit': {
        const { options, async } = ContentAuditSchema.parse(body);
        
        if (async) {
          const jobId = await addAIJob('content-analysis', {
            subtype: 'audit',
            options: options || {},
          }, {
            userId: user.id,
            priority: 8,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await performContentAudit(options || {});
        return NextResponse.json(result);
      }

      case 'engagement-insights': {
        const { timeframe, async } = EngagementInsightsSchema.parse(body);
        
        if (async) {
          const jobId = await addAIJob('analytics-insights', {
            subtype: 'user-engagement',
            timeframe,
          }, {
            userId: user.id,
            priority: 7,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generateUserEngagementInsights(timeframe);
        return NextResponse.json(result);
      }

      case 'moderation-report': {
        const { timeframe, async } = ModerationReportSchema.parse(body);
        
        if (async) {
          const jobId = await addAIJob('analytics-insights', {
            subtype: 'moderation-report',
            timeframe,
          }, {
            userId: user.id,
            priority: 6,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generateModerationReport(timeframe);
        return NextResponse.json(result);
      }

      case 'content-strategy': {
        const { businessGoals, includeCompetitorAnalysis, async } = ContentStrategySchema.parse(body);
        
        // Gather required data for strategy
        const topPerformingPosts = await prisma.post.findMany({
          where: { status: 'PUBLISHED' },
          include: { postAnalytics: true },
          orderBy: { postAnalytics: { views: 'desc' } },
          take: 10,
        });

        const underperformingPosts = await prisma.post.findMany({
          where: { status: 'PUBLISHED' },
          include: { postAnalytics: true },
          orderBy: { postAnalytics: { views: 'asc' } },
          take: 5,
        });

        const analysisData = {
          topPerformingPosts: topPerformingPosts.map(p => ({
            title: p.title,
            views: p.postAnalytics?.views || 0,
            engagement: p.postAnalytics?.engagementScore || 0,
          })),
          underperformingPosts: underperformingPosts.map(p => ({
            title: p.title,
            views: p.postAnalytics?.views || 0,
            issues: ['Low engagement'],
          })),
          userSegments: [
            { name: 'Tech Enthusiasts', size: 100, interests: ['AI', 'ML', 'DevOps'] },
            { name: 'Beginners', size: 150, interests: ['Tutorials', 'Basics'] },
            { name: 'Professionals', size: 80, interests: ['Tools', 'Best Practices'] },
          ],
          businessGoals,
        };

        if (async) {
          const jobId = await addAIJob('analytics-insights', {
            subtype: 'content-strategy',
            analysisData,
          }, {
            userId: user.id,
            priority: 9,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generateContentStrategy(analysisData);
        return NextResponse.json(result);
      }

      case 'analytics-insights': {
        const { timeframe, async } = AnalyticsInsightsSchema.parse(body);
        
        // Gather analytics data
        const analyticsData = await gatherAnalyticsData(timeframe);
        
        if (async) {
          const jobId = await addAIJob('analytics-insights', {
            analyticsData,
          }, {
            userId: user.id,
            priority: 7,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generateAnalyticsInsights(analyticsData);
        return NextResponse.json(result);
      }

      case 'automated-report': {
        const { reportType, async } = AutomatedReportSchema.parse(body);
        
        // Gather data for report
        const analyticsData = await gatherAnalyticsData(reportType === 'weekly' ? 'week' : 'month');
        const contentData = await gatherContentData();
        const goals = {
          pageViews: 10000,
          newsletterSignups: 500,
          comments: 100,
        };

        const reportData = {
          analytics: analyticsData,
          content: contentData,
          goals,
        };

        if (async) {
          const jobId = await addAIJob('analytics-insights', {
            subtype: 'automated-report',
            reportType,
            reportData,
          }, {
            userId: user.id,
            priority: 8,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generateAutomatedReport(reportType, reportData);
        return NextResponse.json(result);
      }

      case 'generate-alerts': {
        // Get recent metrics to check for issues
        const metrics = await gatherAlertMetrics();
        
        const result = await generateAdminAlerts(metrics);
        return NextResponse.json(result);
      }

      case 'batch-tasks': {
        const { tasks } = z.object({
          tasks: z.array(z.object({
            type: z.enum(['audit', 'insights', 'moderation', 'strategy']),
            options: z.any().optional(),
          })),
        }).parse(body);
        
        const result = await batchProcessAdminTasks(tasks);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error({ error }, 'AI admin task failed');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/admin - Get admin AI status and stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const jobId = url.searchParams.get('jobId');

    if (jobId) {
      const status = await getJobStatus(jobId);
      return NextResponse.json(status);
    }

    switch (action) {
      case 'status': {
        const [usageStats, queueStats, aiEnabled] = await Promise.all([
          getUsageStats(),
          getQueueStats(),
          isAIEnabled(),
        ]);

        return NextResponse.json({
          ai: {
            enabled: aiEnabled,
            usage: usageStats,
          },
          queue: queueStats,
          system: {
            lastUpdate: new Date(),
            version: '1.0.0',
          },
        });
      }

      case 'queue-stats': {
        const stats = await getQueueStats();
        return NextResponse.json(stats);
      }

      case 'dashboard-data': {
        // Get overview data for admin dashboard
        const [
          totalPosts,
          totalUsers,
          totalComments,
          pendingModeration,
          recentActivity,
        ] = await Promise.all([
          prisma.post.count(),
          prisma.user.count(),
          prisma.comment.count(),
          prisma.comment.count({ where: { status: 'PENDING' } }),
          prisma.userActivity.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

        return NextResponse.json({
          overview: {
            totalPosts,
            totalUsers,
            totalComments,
            pendingModeration,
            recentActivity,
          },
          recommendations: [
            'Run content audit for SEO optimization',
            'Review user engagement patterns',
            'Update content strategy based on analytics',
          ],
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error({ error }, 'AI admin API error');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper functions
async function gatherAnalyticsData(timeframe: string) {
  const timeFrameDate = getTimeFrameDate(timeframe);
  
  const activities = await prisma.userActivity.findMany({
    where: { createdAt: { gte: timeFrameDate } },
    take: 1000,
  });

  const sessions = await prisma.sessionAnalytics.findMany({
    where: { startedAt: { gte: timeFrameDate } },
    take: 500,
  });

  return {
    timeframe: timeframe as any,
    metrics: {
      pageViews: activities.filter(a => a.activityType === 'PAGE_VIEW').length,
      uniqueVisitors: new Set(activities.map(a => a.sessionId)).size,
      bounceRate: Math.round((sessions.filter(s => s.bounced).length / sessions.length) * 100),
      avgSessionDuration: Math.round(sessions.reduce((sum, s) => sum + s.totalTime, 0) / sessions.length / 60), // minutes
      conversionRate: Math.round((sessions.filter(s => s.converted).length / sessions.length) * 100),
      newsletterSignups: activities.filter(a => a.activityType === 'NEWSLETTER_SIGNUP').length,
      comments: activities.filter(a => a.activityType === 'COMMENT').length,
      shares: activities.filter(a => a.activityType === 'SHARE').length,
    },
    topPages: [],
    userSegments: [],
    trafficSources: {},
    deviceBreakdown: sessions.reduce((acc, s) => {
      acc[s.deviceType] = (acc[s.deviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    geographicData: sessions.reduce((acc, s) => {
      if (s.country) {
        acc[s.country] = (acc[s.country] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>),
  };
}

async function gatherContentData() {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      postAnalytics: true,
      categories: { select: { category: { select: { name: true } } } },
      tags: { select: { tag: { select: { name: true } } } },
    },
    take: 100,
  });

  return {
    posts: posts.map(post => ({
      id: post.id,
      title: post.title,
      category: post.categories[0]?.category.name || 'General',
      publishedAt: post.publishedAt || post.createdAt,
      views: post.postAnalytics?.views || 0,
      readTime: post.estimatedReadTime || 5,
      engagementScore: post.postAnalytics?.engagementScore || 0,
      comments: post.postAnalytics?.commentCount || 0,
      shares: post.postAnalytics?.shareCount || 0,
      bounceRate: post.postAnalytics?.bounceRate || 0,
      conversionRate: 0, // Would need to track this
    })),
    categories: {},
    tags: {},
  };
}

async function gatherAlertMetrics() {
  // Get metrics to check for issues
  const recentActivities = await prisma.userActivity.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const previousActivities = await prisma.userActivity.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const spamComments = await prisma.comment.count({
    where: {
      moderationStatus: 'spam',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const trafficDrop = previousActivities > 0 
    ? Math.round(((previousActivities - recentActivities) / previousActivities) * 100)
    : 0;

  return {
    trafficDrop: trafficDrop > 20 ? trafficDrop : undefined,
    engagementDrop: undefined, // Would need to calculate
    spamIncrease: spamComments > 5 ? spamComments : undefined,
    errorRate: undefined, // Would need error tracking
    performanceIssues: [], // Would need performance monitoring
  };
}

function getTimeFrameDate(timeframe: string): Date {
  const now = new Date();
  
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}