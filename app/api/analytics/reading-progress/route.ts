import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionId, hasAnalyticsConsent } from '@/lib/analytics';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      postId,
      timeSpent,
      scrollDepth,
      wordsRead,
      engaged,
      isFinal = false,
      engagementEvents = 0,
    } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const sessionId = getSessionId(request);
    const hasConsent = await hasAnalyticsConsent(sessionId);

    // Allow basic progress tracking without consent
    if (!hasConsent && !isFinal) {
      return NextResponse.json({ success: true, message: 'Progress tracking skipped - no consent' });
    }

    // Get user ID from session/auth if available
    // This would typically come from your auth system
    const userId = null; // TODO: Get from session

    // Record the reading progress
    await prisma.userActivity.create({
      data: {
        postId,
        sessionId,
        userId,
        activityType: 'PAGE_VIEW',
        timeOnPage: Math.round(timeSpent),
        scrollPercentage: Math.round(scrollDepth),
        clickData: {
          wordsRead,
          engaged,
          engagementEvents,
          isFinal,
        },
        consentGiven: hasConsent,
      },
    });

    // Update PostAnalytics with aggregated data
    await updatePostAnalyticsFromProgress(postId, {
      timeSpent,
      scrollDepth,
      engaged,
      isSessionComplete: isFinal,
    });

    logger.debug({
      postId,
      sessionId,
      timeSpent,
      scrollDepth,
      engaged,
      isFinal,
    }, 'Reading progress saved');

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error({ error }, 'Failed to save reading progress');
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function updatePostAnalyticsFromProgress(
  postId: string,
  progress: {
    timeSpent: number;
    scrollDepth: number;
    engaged: boolean;
    isSessionComplete: boolean;
  }
) {
  try {
    // Get current analytics
    let postAnalytics = await prisma.postAnalytics.findUnique({
      where: { postId },
    });

    if (!postAnalytics) {
      postAnalytics = await prisma.postAnalytics.create({
        data: { postId },
      });
    }

    const updateData: any = {};

    // Update average read time
    if (progress.timeSpent > 0) {
      const currentAvg = postAnalytics.avgReadTime;
      const newAvg = currentAvg > 0 
        ? (currentAvg * 0.9) + (progress.timeSpent * 0.1) // Weighted average
        : progress.timeSpent;
      updateData.avgReadTime = newAvg;
    }

    // Update max scroll depth
    if (progress.scrollDepth > postAnalytics.scrollDepth) {
      updateData.scrollDepth = progress.scrollDepth;
    }

    // Calculate bounce rate (simplified)
    if (progress.isSessionComplete) {
      const currentBounceRate = postAnalytics.bounceRate;
      const bounced = !progress.engaged || progress.timeSpent < 30;
      const newBounceRate = currentBounceRate > 0
        ? (currentBounceRate * 0.9) + (bounced ? 0.1 : 0)
        : bounced ? 1.0 : 0.0;
      updateData.bounceRate = Math.min(1, newBounceRate);
    }

    // Recalculate engagement score
    const baseScore = Math.min(100, (
      (progress.scrollDepth * 0.3) +
      (Math.min(progress.timeSpent / 180, 1) * 40) + // 3 minutes = full time score
      (progress.engaged ? 30 : 0)
    ));

    if (baseScore > postAnalytics.engagementScore) {
      updateData.engagementScore = baseScore;
    }

    // Apply updates
    if (Object.keys(updateData).length > 0) {
      await prisma.postAnalytics.update({
        where: { postId },
        data: updateData,
      });
    }

    // Update trending data if applicable
    await updateTrendingData(postId, progress);

  } catch (error) {
    logger.error({ error, postId }, 'Failed to update post analytics from progress');
  }
}

async function updateTrendingData(
  postId: string,
  progress: { timeSpent: number; scrollDepth: number; engaged: boolean }
) {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    // Calculate trending score based on recent engagement
    const recentEngagements = await prisma.userActivity.count({
      where: {
        postId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        activityType: {
          in: ['PAGE_VIEW', 'SHARE', 'COMMENT', 'LIKE'],
        },
      },
    });

    const engagementWeight = progress.engaged ? 2 : 1;
    const timeWeight = Math.min(progress.timeSpent / 300, 1); // 5 minutes = max weight
    const scrollWeight = progress.scrollDepth / 100;
    
    const trendingScore = (recentEngagements * engagementWeight * timeWeight * scrollWeight);

    // Update or create trending data
    await prisma.trendingArticle.upsert({
      where: { postId },
      create: {
        postId,
        trendingScore,
        timeframe: '24h',
        views24h: 1,
        engagements24h: progress.engaged ? 1 : 0,
        peakHour: hour,
        isCurrentlyTrending: trendingScore > 10,
      },
      update: {
        trendingScore,
        views24h: { increment: 1 },
        engagements24h: { increment: progress.engaged ? 1 : 0 },
        peakHour: hour, // Simple approach - could be more sophisticated
        isCurrentlyTrending: trendingScore > 10,
      },
    });

  } catch (error) {
    logger.error({ error, postId }, 'Failed to update trending data');
  }
}