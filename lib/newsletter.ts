import pino from 'pino';

import { prisma } from './prisma';
import { idempotencyManager } from './reliability';

// TODO: Queue system for Vercel deployment
// import { newsletterQueue } from '@/server/queue';

const logger = pino({
  name: 'newsletter',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

export interface CreateNewsletterIssueData {
  subject: string;
  body: string;
  target?: 'all' | 'verified';
}

/**
 * Create a newsletter issue and enqueue jobs for subscribers
 */
export async function enqueueNewsletter(
  data: CreateNewsletterIssueData,
  userId: string,
): Promise<{
  issueId: string;
  jobCount: number;
  skipped: number;
}> {
  const { subject, body, target = 'verified' } = data;

  // Generate idempotency key
  const idempotencyKey = idempotencyManager.generateKey(
    'newsletter',
    subject,
    body.substring(0, 100), // Use first 100 chars for key
    new Date().toISOString().split('T')[0], // Date part only
  );

  // Check for duplicate
  if (idempotencyManager.has(idempotencyKey)) {
    logger.warn({ subject }, 'Duplicate newsletter detected, skipping');
    throw new Error('A similar newsletter was recently sent');
  }

  return idempotencyManager.execute(
    idempotencyKey,
    async () => {
      // Create newsletter issue
      const issue = await prisma.newsletterIssue.create({
        data: {
          subject,
          body,
          status: 'sending',
        },
      });

      logger.info({ issueId: issue.id, subject }, 'Newsletter issue created');

      // Get target subscribers
      const whereClause = target === 'all' ? {} : { status: 'verified' };

      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: whereClause,
        select: { id: true, email: true },
      });

      if (subscribers.length === 0) {
        await prisma.newsletterIssue.update({
          where: { id: issue.id },
          data: { status: 'no_subscribers' },
        });
        throw new Error('No subscribers found for the selected target');
      }

      // Create job records and enqueue
      let jobCount = 0;
      let skipped = 0;
      const jobs = [];

      for (const subscriber of subscribers) {
        try {
          // Check if job already exists (idempotency)
          const existingJob = await prisma.newsletterJob.findUnique({
            where: {
              issueId_subscriberId: {
                issueId: issue.id,
                subscriberId: subscriber.id,
              },
            },
          });

          if (existingJob) {
            skipped++;
            continue;
          }

          // Create job record
          const jobRecord = await prisma.newsletterJob.create({
            data: {
              issueId: issue.id,
              subscriberId: subscriber.id,
              status: 'pending',
            },
          });

          // Prepare job for queue
          jobs.push({
            name: `newsletter-${issue.id}-${subscriber.id}`,
            data: {
              jobId: jobRecord.id,
              issueId: issue.id,
              subscriberId: subscriber.id,
            },
            opts: {
              // Use subscriber ID in job ID for deduplication
              jobId: `newsletter:${issue.id}:${subscriber.id}`,
            },
          });

          jobCount++;
        } catch (error) {
          logger.error(
            {
              subscriberId: subscriber.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            'Failed to create job for subscriber',
          );
        }
      }

      // TODO: Queue system for Vercel deployment
      // Bulk add jobs to queue  
      if (jobs.length > 0) {
        // await newsletterQueue.addBulk(jobs);
        logger.info({ issueId: issue.id, jobCount }, 'Newsletter jobs enqueued (queue disabled for Vercel)');
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'newsletter.send',
          target: `issue:${issue.id}`,
          data: {
            subject,
            target,
            subscriberCount: jobCount,
            skipped,
          },
        },
      });

      return {
        issueId: issue.id,
        jobCount,
        skipped,
      };
    },
    { returnCached: false },
  );
}

/**
 * Get newsletter job statistics
 */
export async function getNewsletterStats(issueId?: string) {
  const whereClause = issueId ? { issueId } : {};

  const [total, pending, processing, completed, failed] = await Promise.all([
    prisma.newsletterJob.count({ where: whereClause }),
    prisma.newsletterJob.count({
      where: { ...whereClause, status: 'pending' },
    }),
    prisma.newsletterJob.count({
      where: { ...whereClause, status: 'processing' },
    }),
    prisma.newsletterJob.count({
      where: { ...whereClause, status: 'completed' },
    }),
    prisma.newsletterJob.count({
      where: { ...whereClause, status: 'failed' },
    }),
  ]);

  return {
    total,
    pending,
    processing,
    completed,
    failed,
    successRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

/**
 * Get failed newsletter jobs
 */
export async function getFailedJobs(limit = 50) {
  return prisma.newsletterJob.findMany({
    where: { status: 'failed' },
    include: {
      issue: {
        select: { subject: true },
      },
      subscriber: {
        select: { email: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
}

/**
 * Retry failed newsletter job
 */
export async function retryFailedJob(jobId: string) {
  const job = await prisma.newsletterJob.findUnique({
    where: { id: jobId },
    include: { issue: true, subscriber: true },
  });

  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status !== 'failed') {
    throw new Error('Job is not in failed status');
  }

  // Reset job status
  await prisma.newsletterJob.update({
    where: { id: jobId },
    data: {
      status: 'pending',
      error: null,
      attempts: 0,
    },
  });

  // TODO: Re-enqueue job (queue disabled for Vercel)
  // await newsletterQueue.add(
  //   `newsletter-retry-${job.id}`,
  //   {
  //     jobId: job.id,
  //     issueId: job.issueId,
  //     subscriberId: job.subscriberId,
  //   },
  //   {
  //     jobId: `newsletter:${job.issueId}:${job.subscriberId}:retry:${Date.now()}`,
  //   },
  // );

  logger.info({ jobId }, 'Failed job retried');

  return { success: true };
}

/**
 * Get recent newsletter issues
 */
export async function getNewsletterIssues(limit = 20) {
  const issues = await prisma.newsletterIssue.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Get stats for each issue
  const issuesWithStats = await Promise.all(
    issues.map(async (issue) => {
      const stats = await getNewsletterStats(issue.id);
      return { ...issue, stats };
    }),
  );

  return issuesWithStats;
}
