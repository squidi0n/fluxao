import { NextRequest, NextResponse } from 'next/server';

import { getUsageStats } from '@/lib/ai/budget';
import { auth } from '@/auth';
import { createProblemResponse, ForbiddenError, NotFoundError, InternalServerError } from '@/lib/errors';
import { can } from '@/lib/rbac';
import { getJobStatus, getAIQueueMetrics } from '@/server/queue/ai.jobs';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id || !can(session.user, 'read', 'posts')) {
      return createProblemResponse(new ForbiddenError('You do not have permission to view AI status'));
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    // If jobId provided, return specific job status
    if (jobId) {
      const status = await getJobStatus(jobId);

      if (!status) {
        return createProblemResponse(new NotFoundError('job'));
      }

      return NextResponse.json(status);
    }

    // Otherwise return queue metrics and usage stats
    const [metrics, usage] = await Promise.all([getAIQueueMetrics(), getUsageStats()]);

    return NextResponse.json({
      queue: metrics,
      usage,
    });
  } catch (error) {
    return createProblemResponse(new InternalServerError('Failed to get AI status'));
  }
}
