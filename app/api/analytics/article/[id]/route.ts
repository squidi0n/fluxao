import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Get post analytics
    const postAnalytics = await prisma.postAnalytics.findUnique({
      where: { postId },
      include: {
        post: {
          select: {
            title: true,
            slug: true,
            publishedAt: true,
            authorId: true,
            author: {
              select: {
                name: true,
                username: true,
              }
            }
          }
        }
      }
    });

    if (!postAnalytics) {
      // Return default analytics if none exist yet
      return NextResponse.json({
        views: 0,
        uniqueVisitors: 0,
        avgReadTime: 0,
        bounceRate: 0,
        scrollDepth: 0,
        engagementScore: 0,
        shareCount: 0,
        commentCount: 0,
        likeCount: 0,
        dislikeCount: 0,
        isCurrentlyTrending: false,
      });
    }

    // Get unique visitors count from last 30 days
    const uniqueVisitors = await prisma.userActivity.findMany({
      where: {
        postId,
        activityType: 'PAGE_VIEW',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: { sessionId: true },
      distinct: ['sessionId'],
    });

    // Get trending data
    const trendingData = await prisma.trendingArticle.findUnique({
      where: { postId },
    });

    // Get vote counts from ArticleVote table
    const [likes, dislikes] = await Promise.all([
      prisma.articleVote.count({
        where: { postId, type: 'like' },
      }),
      prisma.articleVote.count({
        where: { postId, type: 'dislike' },
      }),
    ]);

    // Get comment count
    const commentCount = await prisma.comment.count({
      where: { 
        postId,
        status: 'APPROVED',
      },
    });

    const response = {
      views: postAnalytics.views,
      uniqueVisitors: uniqueVisitors.length,
      avgReadTime: postAnalytics.avgReadTime,
      bounceRate: postAnalytics.bounceRate,
      scrollDepth: postAnalytics.scrollDepth,
      engagementScore: postAnalytics.engagementScore,
      shareCount: postAnalytics.shareCount,
      commentCount,
      likeCount: likes,
      dislikeCount: dislikes,
      isCurrentlyTrending: trendingData?.isCurrentlyTrending || false,
      trendingScore: trendingData?.trendingScore || 0,
      peakTrafficHour: trendingData?.peakHour || null,
      post: postAnalytics.post,
      lastUpdated: postAnalytics.updatedAt,
    };

    logger.debug({ postId, analytics: response }, 'Article analytics retrieved');

    return NextResponse.json(response);

  } catch (error) {
    logger.error({ error, postId: params.id }, 'Failed to get article analytics');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Admin endpoint to reset analytics (useful for testing)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Check if user has admin permissions
    // TODO: Implement proper admin check based on your auth system
    const isAdmin = false; // Replace with actual admin check

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete analytics data
    await Promise.all([
      prisma.postAnalytics.deleteMany({ where: { postId } }),
      prisma.userActivity.deleteMany({ where: { postId } }),
      prisma.trendingArticle.deleteMany({ where: { postId } }),
    ]);

    logger.info({ postId }, 'Article analytics reset');

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error({ error, postId: params.id }, 'Failed to reset article analytics');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}