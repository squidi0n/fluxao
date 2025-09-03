import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { createProblemResponse } from '@/lib/errors';
import {
  getNewsletterStats,
  getFailedJobs,
  retryFailedJob,
  getNewsletterIssues,
} from '@/lib/newsletter';
import { can } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !can(session.user, 'read', 'newsletter')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to view newsletter jobs',
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const issueId = searchParams.get('issueId');
    const view = searchParams.get('view') || 'stats';

    if (view === 'stats') {
      // Get overall statistics
      const stats = await getNewsletterStats(issueId || undefined);
      return NextResponse.json(stats);
    }

    if (view === 'failed') {
      // Get failed jobs
      const limit = parseInt(searchParams.get('limit') || '50');
      const failedJobs = await getFailedJobs(limit);

      // Mask email addresses
      const maskedJobs = failedJobs.map((job) => ({
        ...job,
        subscriber: {
          email: maskEmail(job.subscriber.email),
        },
      }));

      return NextResponse.json({
        jobs: maskedJobs,
        total: maskedJobs.length,
      });
    }

    if (view === 'issues') {
      // Get recent issues with stats
      const limit = parseInt(searchParams.get('limit') || '20');
      const issues = await getNewsletterIssues(limit);

      return NextResponse.json({
        issues,
        total: issues.length,
      });
    }

    // Default: return queue metrics
    const { newsletterQueue, dlqQueue } = await import('@/server/queue');

    const [newsletterCounts, dlqCounts, stats] = await Promise.all([
      newsletterQueue.getJobCounts(),
      dlqQueue.getJobCounts(),
      getNewsletterStats(),
    ]);

    return NextResponse.json({
      queue: {
        newsletter: newsletterCounts,
        dlq: dlqCounts,
      },
      stats,
      circuit: await getCircuitBreakerStatus(),
      backpressure: await getBackpressureStatus(),
    });
  } catch (error) {
    // console.error('Get newsletter jobs error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to fetch newsletter jobs',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !can(session.user, 'manage', 'newsletter')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to manage newsletter jobs',
      });
    }

    const body = await request.json();
    const { action, jobId } = body;

    if (action === 'retry' && jobId) {
      // Retry a failed job
      const result = await retryFailedJob(jobId);

      // Audit log
      const { prisma } = await import('@/lib/prisma');
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'newsletter.retry',
          target: `job:${jobId}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Job retried successfully',
      });
    }

    if (action === 'reset-circuit') {
      // Reset circuit breaker
      const { newsletterCircuitBreaker } = await import('@/lib/reliability');
      newsletterCircuitBreaker.reset();

      // Audit log
      const { prisma } = await import('@/lib/prisma');
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'newsletter.reset_circuit',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Circuit breaker reset successfully',
      });
    }

    return createProblemResponse({
      status: 400,
      title: 'Invalid Action',
      detail: 'Invalid action specified',
    });
  } catch (error) {
    // console.error('Manage newsletter jobs error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to manage newsletter jobs',
    });
  }
}

// Helper functions
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';

  const maskedLocal = local.length > 3 ? `${local.substring(0, 3)}***` : '***';

  return `${maskedLocal}@${domain}`;
}

async function getCircuitBreakerStatus() {
  try {
    const { newsletterCircuitBreaker } = await import('@/lib/reliability');
    return newsletterCircuitBreaker.getState();
  } catch {
    return { state: 'UNKNOWN', failures: 0 };
  }
}

async function getBackpressureStatus() {
  try {
    const { backpressureManager } = await import('@/lib/reliability');
    return backpressureManager.getStatus();
  } catch {
    return { activeJobs: 0, queuedJobs: 0, maxConcurrency: 5 };
  }
}
