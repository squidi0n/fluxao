import { prisma } from '@/lib/prisma';
import { calculateTrendingScore } from '@/lib/reco';

/**
 * Recompute post scores for trending algorithm
 * Should be run every 10 minutes via cron
 */
export async function recomputePostScores() {
  // console.log('[PostScore Job] Starting recomputation...');

  try {
    // Get all posts with their stats from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: thirtyDaysAgo,
          lte: new Date(),
        },
      },
      include: {
        readingHistory: {
          select: {
            minutes: true,
          },
        },
      },
    });

    // console.log(`[PostScore Job] Processing ${posts.length} posts...`);

    // Batch update scores
    const updates = [];

    for (const post of posts) {
      const ageInDays = post.publishedAt
        ? (Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
        : 30;

      // Calculate total reading minutes
      const totalMinutes = post.readingHistory.reduce((sum, rh) => sum + rh.minutes, 0);

      // Calculate trending score
      const score = calculateTrendingScore(post.viewCount, totalMinutes, post.fluxCount, ageInDays);

      updates.push(
        prisma.postScore.upsert({
          where: { postId: post.id },
          update: {
            score,
            views: post.viewCount,
            minutes: totalMinutes,
            fluxTotal: post.fluxCount,
            updatedAt: new Date(),
          },
          create: {
            postId: post.id,
            score,
            views: post.viewCount,
            minutes: totalMinutes,
            fluxTotal: post.fluxCount,
          },
        }),
      );
    }

    // Execute all updates
    await prisma.$transaction(updates);

    // Clean up old scores (posts older than 30 days)
    await prisma.postScore.deleteMany({
      where: {
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    // console.log(`[PostScore Job] Successfully updated ${updates.length} post scores`);

    return {
      success: true,
      processed: updates.length,
    };
  } catch (error) {
    // console.error('[PostScore Job] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// For API route usage
export async function POST() {
  const result = await recomputePostScores();
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
