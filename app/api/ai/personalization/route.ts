import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { addAIJob, getJobStatus } from '@/server/queue/ai-jobs';
import {
  generatePersonalizedRecommendations,
  segmentUser,
  personalizeNewsletter,
  adaptContentForSession,
} from '@/lib/ai/personalization';

// Request schemas
const PersonalizeRecommendationsSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  count: z.number().min(1).max(20).default(5),
  context: z.object({
    userAgent: z.string().optional(),
    location: z.string().optional(),
    timeOfDay: z.string().optional(),
    deviceType: z.enum(['mobile', 'desktop', 'tablet']).optional(),
    referrer: z.string().optional(),
    searchIntent: z.string().optional(),
  }).optional(),
  async: z.boolean().optional(),
});

const SegmentUserSchema = z.object({
  userId: z.string(),
  async: z.boolean().optional(),
});

const PersonalizeNewsletterSchema = z.object({
  userId: z.string(),
  availableArticleIds: z.array(z.string()).optional(),
  async: z.boolean().optional(),
});

const AdaptContentSchema = z.object({
  sessionData: z.object({
    pagesViewed: z.array(z.string()),
    timeOnSite: z.number(),
    currentPage: z.string().optional(),
    referrer: z.string().optional(),
    searchQuery: z.string().optional(),
    device: z.string(),
  }),
  async: z.boolean().optional(),
});

/**
 * POST /api/ai/personalization - Generate personalized content and recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const body = await request.json();

    switch (action) {
      case 'recommendations': {
        const { userId, sessionId, count, context, async } = PersonalizeRecommendationsSchema.parse(body);
        
        // Use current user if no userId provided
        const targetUserId = userId || session.user.id;
        
        // Get user behavior data
        const behaviorData = await getUserBehaviorData(targetUserId);
        if (!behaviorData) {
          return NextResponse.json({ error: 'Insufficient user data' }, { status: 400 });
        }

        if (async) {
          const jobId = await addAIJob('personalization', {
            behaviorData,
            context: context || {},
            count,
          }, {
            userId: targetUserId,
            priority: 6,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await generatePersonalizedRecommendations(
          behaviorData,
          context || {},
          count
        );
        return NextResponse.json(result);
      }

      case 'segment-user': {
        const { userId, async } = SegmentUserSchema.parse(body);
        
        const behaviorData = await getUserBehaviorData(userId);
        if (!behaviorData) {
          return NextResponse.json({ error: 'Insufficient user data' }, { status: 400 });
        }

        if (async) {
          const jobId = await addAIJob('personalization', {
            subtype: 'segmentation',
            behaviorData,
          }, {
            userId,
            priority: 4,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await segmentUser(behaviorData);
        
        // Store segment in user settings
        await prisma.userSettings.upsert({
          where: { userId },
          create: {
            userId,
            interestedTopics: [result.segment.segment],
          },
          update: {
            interestedTopics: [result.segment.segment],
          },
        });
        
        return NextResponse.json(result);
      }

      case 'personalize-newsletter': {
        const { userId, availableArticleIds, async } = PersonalizeNewsletterSchema.parse(body);
        
        // Get available articles
        const articles = await prisma.post.findMany({
          where: availableArticleIds ? {
            id: { in: availableArticleIds },
            status: 'PUBLISHED',
          } : {
            status: 'PUBLISHED',
            publishedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          select: {
            id: true,
            title: true,
            teaser: true,
            slug: true,
            categories: { select: { category: { select: { name: true } } } },
            tags: { select: { tag: { select: { name: true } } } },
          },
          take: 20,
        });

        if (async) {
          const jobId = await addAIJob('personalization', {
            subtype: 'newsletter',
            userId,
            articles,
          }, {
            userId,
            priority: 5,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await personalizeNewsletter(userId, articles);
        return NextResponse.json(result);
      }

      case 'adapt-session': {
        const { sessionData, async } = AdaptContentSchema.parse(body);
        
        if (async) {
          const jobId = await addAIJob('personalization', {
            subtype: 'session-adaptation',
            sessionData,
          }, {
            userId: session.user.id,
            priority: 7,
          });
          
          return NextResponse.json({ jobId, status: 'queued' });
        }
        
        const result = await adaptContentForSession(sessionData);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error({ error }, 'AI personalization failed');
    
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
 * GET /api/ai/personalization - Get user segments or personalization data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId') || session.user.id;
    const jobId = url.searchParams.get('jobId');

    if (jobId) {
      const status = await getJobStatus(jobId);
      return NextResponse.json(status);
    }

    switch (action) {
      case 'user-profile': {
        const behaviorData = await getUserBehaviorData(userId);
        if (!behaviorData) {
          return NextResponse.json({ error: 'No data available' }, { status: 404 });
        }

        // Get user settings for stored preferences
        const settings = await prisma.userSettings.findUnique({
          where: { userId },
        });

        return NextResponse.json({
          behaviorData: {
            totalReadingTime: behaviorData.readingHistory.reduce((sum, h) => sum + h.readTime, 0),
            topCategories: [...new Set(behaviorData.readingHistory.map(h => h.category))].slice(0, 5),
            topTags: [...new Set(behaviorData.readingHistory.flatMap(h => h.tags))].slice(0, 10),
            interactionCount: behaviorData.interactions.length,
            avgEngagement: Math.round(behaviorData.readingHistory.reduce((sum, h) => sum + h.engagement, 0) / behaviorData.readingHistory.length),
          },
          preferences: {
            interests: settings?.interestedTopics || [],
            contentLanguages: settings?.contentLanguages || ['de'],
          },
        });
      }

      case 'segments': {
        // Get all user segments from database (if we store them)
        const segments = await prisma.userSettings.groupBy({
          by: ['interestedTopics'],
          _count: true,
        });

        return NextResponse.json({
          segments: segments.map(s => ({
            name: s.interestedTopics?.[0] || 'Unknown',
            count: s._count,
          })),
        });
      }

      case 'recommendations': {
        // Get cached recommendations for user
        const behaviorData = await getUserBehaviorData(userId);
        if (!behaviorData) {
          return NextResponse.json({ error: 'No data available' }, { status: 404 });
        }

        // Quick recommendations based on reading history
        const topCategories = [...new Set(behaviorData.readingHistory.map(h => h.category))].slice(0, 3);
        
        const recommendations = await prisma.post.findMany({
          where: {
            status: 'PUBLISHED',
            categories: {
              some: {
                category: {
                  name: { in: topCategories },
                },
              },
            },
            id: {
              notIn: behaviorData.readingHistory.map(h => h.postId),
            },
          },
          select: {
            id: true,
            title: true,
            teaser: true,
            slug: true,
            coverImage: true,
            categories: { select: { category: { select: { name: true } } } },
          },
          orderBy: { publishedAt: 'desc' },
          take: 5,
        });

        return NextResponse.json({ recommendations });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error({ error }, 'AI personalization API error');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper function to get user behavior data
async function getUserBehaviorData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      readingHistory: {
        include: {
          post: {
            select: {
              id: true,
              title: true,
              tags: { select: { tag: { select: { name: true } } } },
              categories: { select: { category: { select: { name: true } } } },
            },
          },
        },
        orderBy: { lastAt: 'desc' },
        take: 20,
      },
      articleVotes: {
        include: {
          post: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      comments: {
        include: {
          post: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) return null;

  return {
    userId,
    readingHistory: user.readingHistory.map(h => ({
      postId: h.post.id,
      title: h.post.title,
      category: h.post.categories[0]?.category.name || 'Uncategorized',
      tags: h.post.tags.map(t => t.tag.name),
      readTime: h.minutes,
      scrollDepth: h.lastDepth,
      engagement: Math.min(h.minutes / 5, 10), // Rough engagement score
    })),
    interactions: [
      ...user.articleVotes.map(v => ({
        type: v.type as 'like',
        postId: v.postId,
        timestamp: v.createdAt,
      })),
      ...user.comments.map(c => ({
        type: 'comment' as const,
        postId: c.postId,
        timestamp: c.createdAt,
      })),
    ],
    searchHistory: [], // Would need separate tracking
    timeOnSite: user.readingHistory.reduce((sum, h) => sum + h.minutes, 0),
    deviceType: 'desktop', // Would need to track this
  };
}