import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUsageStats } from '@/lib/ai/budget';
import { auth } from '@/auth';
import { createProblemResponse, ForbiddenError, ValidationError, RateLimitError, InternalServerError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { can } from '@/lib/rbac';
import { enqueueAutotagJob } from '@/server/queue/ai.jobs';

const AutotagRequestSchema = z.object({
  postId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id || !can(session.user, 'update', 'posts')) {
      return createProblemResponse(new ForbiddenError('You do not have permission to generate tags'));
    }

    // Parse and validate request
    const body = await request.json();
    const validation = AutotagRequestSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse(new ValidationError('Validation failed', validation.error.issues));
    }

    const { postId } = validation.data;

    // Check usage stats
    const stats = await getUsageStats();
    if (stats.remaining < 150) {
      return createProblemResponse(
        new RateLimitError(3600)
      );
    }

    // Enqueue job
    const job = await enqueueAutotagJob({
      postId,
      userId: user!.id,
    });

    logger.info(
      {
        userId: user!.id,
        postId,
        jobId: job.id,
      },
      'Autotag job enqueued',
    );

    // Return 202 Accepted with job info
    return NextResponse.json(
      {
        jobId: job.id,
        status: 'queued',
        postId,
        message: 'Tag generation started',
      },
      { status: 202 },
    );
  } catch (error) {
    logger.error({ error }, 'Failed to enqueue autotag job');
    return createProblemResponse(new InternalServerError('Failed to start tag generation'));
  }
}
