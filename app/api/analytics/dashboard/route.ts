import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const timeframe = searchParams.get('timeframe') || '30d';

    if (!authorId) {
      return NextResponse.json({ error: 'Author ID required' }, { status: 400 });
    }

    // Calculate date range
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
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get author's posts
    const authorPosts = await prisma.post.findMany({
      where: {
        authorId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        postAnalytics: true,
        trendingData: true,
        comments: {
          where: { status: 'APPROVED' },
          select: { id: true },
        },
        articleVotes: {
          select: { type: true },
        },
      },
    });

    const publishedPostIds = authorPosts.map(post => post.id);

    // Get aggregated analytics
    const [
      totalViews,
      totalUniqueVisitors,
      totalEngagementEvents,
      recentActivity,
      engagementByHour,
    ] = await Promise.all([
      // Total views
      prisma.postAnalytics.aggregate({
        where: { postId: { in: publishedPostIds } },
        _sum: { views: true },
      }),

      // Unique visitors (last 30 days)
      prisma.userActivity.findMany({
        where: {
          postId: { in: publishedPostIds },
          activityType: 'PAGE_VIEW',
          createdAt: { gte: startDate },
        },
        select: { sessionId: true },
        distinct: ['sessionId'],
      }),

      // Total engagement events
      prisma.userActivity.count({
        where: {
          postId: { in: publishedPostIds },
          activityType: { in: ['SHARE', 'COMMENT', 'LIKE', 'COPY_TEXT'] },
          createdAt: { gte: startDate },
        },
      }),

      // Recent activity
      prisma.userActivity.findMany({
        where: {
          postId: { in: publishedPostIds },
          createdAt: { gte: startDate },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            select: { title: true, slug: true },
          },
        },
      }),

      // Engagement by hour
      prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "createdAt") as hour,
          COUNT(*) as views,
          COUNT(CASE WHEN "activityType" IN ('SHARE', 'COMMENT', 'LIKE') THEN 1 END) as engagements
        FROM "user_activities"
        WHERE "postId" IN (${publishedPostIds.map(() => '?').join(',')}) 
        AND "createdAt" >= ?
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY hour
      ` as any,
    ]);

    // Calculate metrics
    const totalPostAnalytics = authorPosts.reduce((acc, post) => {
      if (post.postAnalytics) {
        acc.totalViews += post.postAnalytics.views;
        acc.totalShares += post.postAnalytics.shareCount;
        acc.avgReadTime += post.postAnalytics.avgReadTime;
        acc.engagementScore += post.postAnalytics.engagementScore;
      }
      return acc;
    }, {
      totalViews: 0,
      totalShares: 0,
      avgReadTime: 0,
      engagementScore: 0,
    });

    const avgReadTime = authorPosts.length > 0 
      ? totalPostAnalytics.avgReadTime / authorPosts.length 
      : 0;
    
    const totalEngagementScore = authorPosts.length > 0
      ? totalPostAnalytics.engagementScore / authorPosts.length
      : 0;

    // Calculate totals
    const totalComments = authorPosts.reduce((sum, post) => sum + post.comments.length, 0);
    const totalLikes = authorPosts.reduce((sum, post) => 
      sum + post.articleVotes.filter(vote => vote.type === 'like').length, 0
    );

    // Get top performing articles
    const topPerformingArticles = authorPosts
      .sort((a, b) => {
        const aScore = a.postAnalytics?.engagementScore || 0;
        const bScore = b.postAnalytics?.engagementScore || 0;
        return bScore - aScore;
      })
      .slice(0, 10)
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        views: post.postAnalytics?.views || 0,
        engagementScore: post.postAnalytics?.engagementScore || 0,
        publishedAt: post.publishedAt?.toISOString(),
        trendingScore: post.trendingData?.trendingScore || 0,
      }));

    // Get recent articles
    const recentArticles = authorPosts
      .sort((a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 10)
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        views: post.postAnalytics?.views || 0,
        comments: post.comments.length,
        likes: post.articleVotes.filter(vote => vote.type === 'like').length,
        publishedAt: post.publishedAt?.toISOString(),
        status: 'PUBLISHED' as const,
      }));

    // Format engagement by time data
    const engagementByTime = Array.from({ length: 24 }, (_, hour) => {
      const hourData = engagementByHour.find((h: any) => h.hour === hour);
      return {
        hour,
        views: hourData?.views || 0,
        engagements: hourData?.engagements || 0,
      };
    });

    // Calculate performance metrics
    const performanceMetrics = {
      avgViewsPerArticle: authorPosts.length > 0 
        ? totalPostAnalytics.totalViews / authorPosts.length 
        : 0,
      avgEngagementRate: totalEngagementScore / 100, // Convert to decimal
      avgShareRate: authorPosts.length > 0 
        ? totalPostAnalytics.totalShares / totalPostAnalytics.totalViews || 0
        : 0,
      avgCommentRate: authorPosts.length > 0
        ? totalComments / totalPostAnalytics.totalViews || 0
        : 0,
    };

    // Calculate changes (simplified - comparing with previous period)
    // In a real implementation, you'd want to fetch data for the previous period
    const viewsChange = 0; // No mock delta
    const engagementChange = 0; // No mock delta

    const response = {
      totalViews: totalPostAnalytics.totalViews,
      totalUniqueVisitors: totalUniqueVisitors.length,
      avgReadTime,
      totalEngagementScore,
      totalArticles: authorPosts.length,
      publishedArticles: authorPosts.length,
      totalShares: totalPostAnalytics.totalShares,
      totalComments,
      totalLikes,
      followerCount: 0, // TODO: Get from user's followers
      viewsChange,
      engagementChange,
      topPerformingArticles,
      recentArticles,
      engagementByTime,
      performanceMetrics,
      timeframe,
      lastUpdated: new Date().toISOString(),
    };

    logger.debug({ 
      authorId, 
      timeframe, 
      postsCount: authorPosts.length 
    }, 'Author dashboard analytics retrieved');

    return NextResponse.json(response);

  } catch (error) {
    logger.error({ error, authorId: request.url }, 'Failed to get author dashboard analytics');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
