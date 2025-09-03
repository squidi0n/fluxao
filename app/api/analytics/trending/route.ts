import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');

    // Calculate date range for trending calculation
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setHours(now.getHours() - 24);
    }

    // Build where clause
    const whereClause: any = {
      post: {
        status: 'PUBLISHED',
        publishedAt: { lte: now },
      },
    };

    if (category) {
      whereClause.post.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    // Get trending articles
    const trendingArticles = await prisma.trendingArticle.findMany({
      where: {
        ...whereClause,
        isCurrentlyTrending: true,
        updatedAt: { gte: startDate },
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
            categories: {
              include: {
                category: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            tags: {
              include: {
                tag: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            postAnalytics: true,
            _count: {
              select: {
                comments: {
                  where: { status: 'APPROVED' },
                },
                articleVotes: {
                  where: { type: 'like' },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { trendingScore: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
    });

    // If we don't have enough trending articles, fill with high-engagement recent articles
    if (trendingArticles.length < limit) {
      const remainingLimit = limit - trendingArticles.length;
      const existingPostIds = trendingArticles.map(ta => ta.postId);

      const recentHighEngagement = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { 
            gte: startDate,
            lte: now,
          },
          id: { notIn: existingPostIds },
          postAnalytics: {
            engagementScore: { gte: 20 },
          },
          ...(category && {
            categories: {
              some: {
                category: { slug: category },
              },
            },
          }),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          categories: {
            include: {
              category: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
          postAnalytics: true,
          _count: {
            select: {
              comments: {
                where: { status: 'APPROVED' },
              },
              articleVotes: {
                where: { type: 'like' },
              },
            },
          },
        },
        orderBy: [
          { postAnalytics: { engagementScore: 'desc' } },
          { publishedAt: 'desc' },
        ],
        take: remainingLimit,
      });

      // Add these to trending articles as pseudo-trending
      for (const post of recentHighEngagement) {
        trendingArticles.push({
          id: `pseudo-${post.id}`,
          postId: post.id,
          post,
          trendingScore: post.postAnalytics?.engagementScore || 0,
          timeframe,
          views24h: post.postAnalytics?.views || 0,
          views7d: post.postAnalytics?.views || 0,
          views30d: post.postAnalytics?.views || 0,
          engagements24h: 0,
          engagements7d: 0,
          engagements30d: 0,
          peakHour: null,
          isCurrentlyTrending: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    // Format response
    const formattedArticles = trendingArticles.map(article => ({
      id: article.post.id,
      title: article.post.title,
      slug: article.post.slug,
      excerpt: article.post.excerpt,
      coverImage: article.post.coverImage,
      publishedAt: article.post.publishedAt,
      trendingScore: article.trendingScore,
      isCurrentlyTrending: article.isCurrentlyTrending,
      timeframe: article.timeframe,
      
      // Analytics data
      views: article.post.postAnalytics?.views || 0,
      engagementScore: article.post.postAnalytics?.engagementScore || 0,
      avgReadTime: article.post.postAnalytics?.avgReadTime || 0,
      scrollDepth: article.post.postAnalytics?.scrollDepth || 0,
      
      // Interaction counts
      commentCount: article.post._count.comments,
      likeCount: article.post._count.articleVotes,
      shareCount: article.post.postAnalytics?.shareCount || 0,
      
      // Views by timeframe
      views24h: article.views24h,
      views7d: article.views7d,
      views30d: article.views30d,
      
      // Peak traffic info
      peakHour: article.peakHour,
      
      // Author info
      author: article.post.author,
      
      // Categories and tags
      categories: article.post.categories.map(pc => pc.category),
      tags: article.post.tags.map(pt => pt.tag),
      
      // Trending metadata
      updatedAt: article.updatedAt,
    }));

    // Calculate trending stats
    const trendingStats = {
      totalTrendingArticles: trendingArticles.filter(a => a.isCurrentlyTrending).length,
      avgTrendingScore: trendingArticles.reduce((sum, a) => sum + a.trendingScore, 0) / trendingArticles.length || 0,
      timeframe,
      generatedAt: now.toISOString(),
    };

    logger.debug({
      timeframe,
      limit,
      category,
      articlesFound: trendingArticles.length,
    }, 'Trending articles retrieved');

    return NextResponse.json({
      articles: formattedArticles,
      stats: trendingStats,
    });

  } catch (error) {
    logger.error({ error }, 'Failed to get trending articles');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Admin endpoint to recalculate trending scores
export async function POST(request: NextRequest) {
  try {
    // TODO: Check admin permissions
    const isAdmin = false; // Replace with actual admin check
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { timeframe = '24h' } = body;

    // Get all posts with recent activity
    const recentPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - (timeframe === '24h' ? 24 : timeframe === '7d' ? 7 * 24 : 30 * 24) * 60 * 60 * 1000),
        },
      },
      include: {
        postAnalytics: true,
        userActivities: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h for trending calculation
            },
          },
        },
      },
    });

    // Recalculate trending scores
    const updates = [];
    
    for (const post of recentPosts) {
      const recentViews = post.userActivities.filter(a => a.activityType === 'PAGE_VIEW').length;
      const recentEngagements = post.userActivities.filter(a => 
        ['SHARE', 'COMMENT', 'LIKE', 'COPY_TEXT'].includes(a.activityType)
      ).length;
      
      // Trending score formula
      const viewsWeight = Math.min(recentViews / 100, 1); // Normalize views
      const engagementWeight = recentEngagements * 2;
      const timeWeight = post.postAnalytics ? 
        Math.min(post.postAnalytics.avgReadTime / 300, 1) : 0; // 5 minutes = max weight
      const scrollWeight = post.postAnalytics ? 
        post.postAnalytics.scrollDepth / 100 : 0;
      
      const trendingScore = (viewsWeight + engagementWeight + timeWeight + scrollWeight) * 25;
      const isCurrentlyTrending = trendingScore > 10;
      
      updates.push(
        prisma.trendingArticle.upsert({
          where: { postId: post.id },
          create: {
            postId: post.id,
            trendingScore,
            timeframe,
            views24h: recentViews,
            engagements24h: recentEngagements,
            isCurrentlyTrending,
          },
          update: {
            trendingScore,
            views24h: recentViews,
            engagements24h: recentEngagements,
            isCurrentlyTrending,
          },
        })
      );
    }

    // Execute all updates
    await Promise.all(updates);

    logger.info({
      postsProcessed: recentPosts.length,
      timeframe,
    }, 'Trending scores recalculated');

    return NextResponse.json({
      success: true,
      postsProcessed: recentPosts.length,
      timeframe,
    });

  } catch (error) {
    logger.error({ error }, 'Failed to recalculate trending scores');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}