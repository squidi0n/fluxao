import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { createProblemResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { enqueueNewsletterPublish } from '@/server/queue/newsletter.jobs';

// GET /api/admin/newsletter/drafts/[id] - Get single draft
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !can(session.user, 'read', 'newsletter')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to view newsletter drafts',
      });
    }

    const draft = await prisma.newsletterDraft.findUnique({
      where: { id: id },
    });

    if (!draft) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Newsletter draft not found',
      });
    }

    return NextResponse.json(draft);
  } catch (error) {
    logger.error({ error, draftId: id }, 'Failed to get newsletter draft');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to get newsletter draft',
    });
  }
}

// PUT /api/admin/newsletter/drafts/[id] - Update draft
const UpdateDraftSchema = z.object({
  subject: z.string().optional(),
  intro: z.string().optional(),
  topics: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        url: z.string().optional(),
      }),
    )
    .optional(),
  cta: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !can(session.user, 'update', 'newsletter')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to update newsletter drafts',
      });
    }

    const body = await request.json();
    const validation = UpdateDraftSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const draft = await prisma.newsletterDraft.update({
      where: { id: id },
      data: validation.data,
    });

    logger.info(
      {
        userId: session.user.id,
        draftId: draft.id,
      },
      'Newsletter draft updated',
    );

    return NextResponse.json(draft);
  } catch (error) {
    logger.error({ error, draftId: id }, 'Failed to update newsletter draft');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to update newsletter draft',
    });
  }
}

// DELETE /api/admin/newsletter/drafts/[id] - Delete draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !can(session.user, 'delete', 'newsletter')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to delete newsletter drafts',
      });
    }

    const draft = await prisma.newsletterDraft.findUnique({
      where: { id: id },
    });

    if (!draft) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Newsletter draft not found',
      });
    }

    if (draft.status === 'published') {
      return createProblemResponse({
        status: 400,
        title: 'Bad Request',
        detail: 'Cannot delete published drafts',
      });
    }

    await prisma.newsletterDraft.delete({
      where: { id: id },
    });

    logger.info(
      {
        userId: session.user.id,
        draftId: id,
      },
      'Newsletter draft deleted',
    );

    return NextResponse.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    logger.error({ error, draftId: id }, 'Failed to delete newsletter draft');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to delete newsletter draft',
    });
  }
}

// POST /api/admin/newsletter/drafts/[id]/publish - Publish draft
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !can(session.user, 'publish', 'newsletter')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to publish newsletters',
      });
    }

    const draft = await prisma.newsletterDraft.findUnique({
      where: { id: id },
    });

    if (!draft) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Newsletter draft not found',
      });
    }

    if (draft.status === 'published') {
      return createProblemResponse({
        status: 400,
        title: 'Bad Request',
        detail: 'Draft is already published',
      });
    }

    // Enqueue publish job
    const job = await enqueueNewsletterPublish({
      draftId: draft.id,
      userId: session.user.id,
    });

    logger.info(
      {
        userId: session.user.id,
        draftId: draft.id,
        jobId: job.id,
      },
      'Newsletter publish job enqueued',
    );

    return NextResponse.json(
      {
        jobId: job.id,
        message: 'Newsletter publishing started',
      },
      { status: 202 },
    );
  } catch (error) {
    logger.error({ error, draftId: id }, 'Failed to publish newsletter');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to publish newsletter',
    });
  }
}
