import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createProblemResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sanitizeAuthorName, sanitizeEmail, sanitizeText } from '@/lib/sanitize';
import { checkCommentSpam, verifyHCaptcha, getClientIp, checkRateLimit } from '@/lib/spam';

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(), // Support for threaded replies
  authorName: z.string().min(1).max(100).optional(),
  authorEmail: z.string().email().optional(),
  body: z.string().min(1).max(5000),
  hcaptchaToken: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const status = searchParams.get('status') || 'APPROVED';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!postId) {
      return createProblemResponse({
        status: 400,
        title: 'Bad Request',
        detail: 'postId is required',
      });
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId,
          parentId: null, // Only top-level comments
          status: status as any,
        },
        include: {
          replies: {
            where: {
              status: status as any,
            },
            orderBy: {
              createdAt: 'asc',
            },
            select: {
              id: true,
              authorName: true,
              body: true,
              createdAt: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          authorName: true,
          body: true,
          createdAt: true,
          status: true,
          replies: true,
        },
      }),
      prisma.comment.count({
        where: {
          postId,
          parentId: null, // Count only top-level comments for pagination
          status: status as any,
        },
      }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Get comments error');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to fetch comments',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const data = validation.data;
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    // Rate limiting
    const rateLimitOk = await checkRateLimit(ipAddress, 5, 60000); // 5 comments per minute
    if (!rateLimitOk) {
      return createProblemResponse({
        status: 429,
        title: 'Too Many Requests',
        detail: 'Please wait before posting another comment',
      });
    }

    // Verify hCaptcha if enabled
    if (process.env.HCAPTCHA_SITE_KEY && process.env.NODE_ENV === 'production') {
      if (!data.hcaptchaToken) {
        return createProblemResponse({
          status: 400,
          title: 'Captcha Required',
          detail: 'Please complete the captcha',
        });
      }

      const captchaValid = await verifyHCaptcha(data.hcaptchaToken);
      if (!captchaValid) {
        return createProblemResponse({
          status: 400,
          title: 'Invalid Captcha',
          detail: 'Captcha verification failed',
        });
      }
    }

    // Check if post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: data.postId },
      select: { id: true, status: true },
    });

    if (!post || post.status !== 'PUBLISHED') {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Post not found',
      });
    }

    // Check if parent comment exists (for replies)
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment || parentComment.postId !== data.postId) {
        return createProblemResponse({
          status: 404,
          title: 'Not Found',
          detail: 'Parent comment not found',
        });
      }
    }

    // Sanitize input
    const sanitizedName = data.authorName ? sanitizeAuthorName(data.authorName) : null;
    const sanitizedEmail = data.authorEmail ? sanitizeEmail(data.authorEmail) : null;
    const sanitizedBody = sanitizeText(data.body); // Plain text for storage

    // Check for spam
    const spamCheck = await checkCommentSpam({
      body: sanitizedBody,
      authorName: sanitizedName,
      authorEmail: sanitizedEmail,
      ipAddress,
      userAgent,
    });

    // Determine status based on spam check
    let status = 'PENDING';
    if (spamCheck.isSpam) {
      status = 'SPAM';
      logger.warn(
        {
          postId: data.postId,
          spamScore: spamCheck.score,
          reason: spamCheck.reason,
        },
        'Spam comment detected',
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId: data.postId,
        parentId: data.parentId || null, // Include parentId for threaded replies
        authorName: sanitizedName,
        authorEmail: sanitizedEmail,
        body: sanitizedBody,
        status: status as any,
        ipAddress,
        userAgent,
        spamScore: spamCheck.score,
      },
      select: {
        id: true,
        authorName: true,
        body: true,
        status: true,
        createdAt: true,
      },
    });

    // Enqueue AI moderation job (unless already marked as spam by basic checks)
    if (status !== 'SPAM') {
      try {
        const { enqueueModerationJob } = await import('@/server/queue/moderation.jobs');
        const postTitle = await prisma.post.findUnique({
          where: { id: data.postId },
          select: { title: true },
        });

        await enqueueModerationJob({
          commentId: comment.id,
          content: sanitizedBody,
          authorName: sanitizedName || undefined,
          authorEmail: sanitizedEmail || undefined,
          postTitle: postTitle?.title,
        });

        logger.info({ commentId: comment.id }, 'AI moderation job enqueued');
      } catch (error) {
        logger.error({ error, commentId: comment.id }, 'Failed to enqueue AI moderation');
        // Don't fail the comment creation if moderation enqueue fails
      }
    }

    // Log metrics
    logger.info(
      {
        postId: data.postId,
        commentId: comment.id,
        status: comment.status,
        spamScore: spamCheck.score,
      },
      'Comment created',
    );

    // Return different response based on status
    if (status === 'SPAM') {
      // Don't reveal to spammers that we detected them
      return NextResponse.json({
        message: 'Your comment has been submitted for moderation',
        status: 'pending',
      });
    }

    return NextResponse.json({
      message:
        status === 'PENDING'
          ? 'Your comment has been submitted for moderation'
          : 'Your comment has been posted',
      comment: status === 'APPROVED' ? comment : undefined,
      status: status.toLowerCase(),
    });
  } catch (error) {
    logger.error({ error }, 'Create comment error');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to create comment',
    });
  }
}
