import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { createProblemResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { enqueueFeedbackJob } from '@/server/queue/moderation.jobs';

// POST /api/admin/comments/moderation/[id]/approve - Approve comment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !can(session.user, 'moderate', 'comments')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to moderate comments',
      });
    }

    const { pathname } = new URL(request.url);
    const action = pathname.split('/').pop(); // approve, reject, spam

    if (!['approve', 'reject', 'spam'].includes(action || '')) {
      return createProblemResponse({
        status: 400,
        title: 'Bad Request',
        detail: 'Invalid moderation action',
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: id },
    });

    if (!comment) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Comment not found',
      });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason as string | undefined;

    // Map action to status
    const statusMap = {
      approve: 'APPROVED',
      reject: 'REJECTED',
      spam: 'SPAM',
    };
    const newStatus = statusMap[action as keyof typeof statusMap];
    const originalStatus = comment.moderationStatus;

    // Update comment status
    const updatedComment = await prisma.comment.update({
      where: { id: id },
      data: {
        status: newStatus as any,
        moderatedBy: session.user.id,
        moderatedAt: new Date(),
        // Update moderation fields
        ...(action === 'approve' && {
          moderationStatus: 'ok',
        }),
        ...(action === 'reject' && {
          moderationStatus: 'toxic',
        }),
        ...(action === 'spam' && {
          moderationStatus: 'spam',
        }),
        ...(reason && {
          moderationReason: reason,
        }),
      },
    });

    // Enqueue feedback job for AI learning
    if (originalStatus !== updatedComment.moderationStatus) {
      await enqueueFeedbackJob({
        commentId: id,
        originalStatus,
        newStatus: updatedComment.moderationStatus,
        adminId: session.user.id,
        reason,
      });
    }

    logger.info(
      {
        commentId: id,
        action,
        adminId: session.user.id,
        originalStatus,
        newStatus: updatedComment.moderationStatus,
      },
      'Comment moderation action taken',
    );

    return NextResponse.json({
      success: true,
      comment: updatedComment,
      action,
      message: `Comment ${action}d successfully`,
    });
  } catch (error) {
    logger.error({ error, commentId: id }, 'Failed to moderate comment');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to moderate comment',
    });
  }
}

// GET /api/admin/comments/moderation/[id] - Get single comment for moderation
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !can(session.user, 'moderate', 'comments')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to moderate comments',
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: id },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!comment) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Comment not found',
      });
    }

    return NextResponse.json(comment);
  } catch (error) {
    logger.error({ error, commentId: id }, 'Failed to get comment');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to get comment',
    });
  }
}

// PUT /api/admin/comments/moderation/[id] - Update comment moderation
const UpdateModerationSchema = z.object({
  moderationStatus: z.enum(['ok', 'review', 'spam', 'toxic']).optional(),
  moderationReason: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SPAM']).optional(),
  reason: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !can(session.user, 'moderate', 'comments')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to moderate comments',
      });
    }

    const body = await request.json();
    const validation = UpdateModerationSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: id },
    });

    if (!comment) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Comment not found',
      });
    }

    const originalStatus = comment.moderationStatus;
    const { moderationStatus, moderationReason, status, reason } = validation.data;

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: id },
      data: {
        ...(moderationStatus && { moderationStatus }),
        ...(moderationReason && { moderationReason }),
        ...(status && { status }),
        moderatedBy: session.user.id,
        moderatedAt: new Date(),
      },
    });

    // Record feedback if moderation status changed
    if (moderationStatus && originalStatus !== moderationStatus) {
      await enqueueFeedbackJob({
        commentId: id,
        originalStatus,
        newStatus: moderationStatus,
        adminId: session.user.id,
        reason,
      });
    }

    logger.info(
      {
        commentId: id,
        adminId: session.user.id,
        changes: validation.data,
      },
      'Comment moderation updated',
    );

    return NextResponse.json(updatedComment);
  } catch (error) {
    logger.error({ error, commentId: id }, 'Failed to update comment moderation');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to update comment moderation',
    });
  }
}
