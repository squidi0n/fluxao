import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { createProblemResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { getModerationQueueMetrics } from '@/server/queue/moderation.jobs';
import { getModerationStats } from '@/server/queue/workers/moderation.worker';

// GET /api/admin/comments/moderation - List comments needing moderation
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !can(session.user, 'moderate', 'comments')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to moderate comments',
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, review, spam, toxic, all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const stats = searchParams.get('stats') === 'true';

    // Build filter conditions
    const where: any = {};

    if (status && status !== 'all') {
      where.moderationStatus = status;
    }

    // If no specific status, show items that need human attention
    if (!status || status === 'all') {
      where.OR = [
        { moderationStatus: 'review' },
        { moderationStatus: 'pending', aiReviewed: false },
        { moderationStatus: 'spam' },
        { moderationStatus: 'toxic' },
      ];
    }

    const [comments, total, moderationStats, queueMetrics] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { moderationStatus: 'desc' }, // Review items first
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
      stats ? getModerationStats('7d') : null,
      stats ? getModerationQueueMetrics() : null,
    ]);

    const response: any = {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    if (stats) {
      response.stats = moderationStats;
      response.queue = queueMetrics;
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error({ error }, 'Failed to list moderation comments');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to list moderation comments',
    });
  }
}
