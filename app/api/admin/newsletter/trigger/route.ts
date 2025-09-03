import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auditAdminAction } from '@/lib/audit';
import { createProblemResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

const triggerNewsletterSchema = z.object({
  target: z.enum(['all', 'verified', 'pending']).default('verified'),
  subject: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !can(session.user, 'trigger', 'newsletter')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to trigger newsletters',
      });
    }

    const body = await request.json();
    const validation = triggerNewsletterSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const { target, subject, message } = validation.data;

    // Get target subscribers
    const whereClause = target === 'all' ? {} : { status: target };

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
      },
    });

    if (subscribers.length === 0) {
      return createProblemResponse({
        status: 400,
        title: 'No Subscribers',
        detail: 'No subscribers match the selected criteria',
      });
    }

    // In a real implementation, we would queue a job here
    // For now, we'll just simulate it
    const jobData = {
      type: 'newsletter',
      target,
      subscriberCount: subscribers.length,
      subscriberIds: subscribers.map((s) => s.id),
      subject: subject || 'FluxAO Newsletter',
      message: message || 'Latest updates from FluxAO',
      triggeredBy: session.user.id,
      triggeredAt: new Date().toISOString(),
    };

    // Simulate job queue (in production, use BullMQ or similar)
    // console.log('Newsletter job queued:', jobData);

    // Audit log
    await auditAdminAction(session.user.id, 'trigger_newsletter', 'newsletter', undefined, {
      target,
      subscriberCount: subscribers.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Newsletter job queued successfully',
      count: subscribers.length,
      jobId: `newsletter-${Date.now()}`, // Simulated job ID
    });
  } catch (error) {
    // console.error('Trigger newsletter error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to trigger newsletter',
    });
  }
}
