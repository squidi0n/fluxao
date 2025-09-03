import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { createProblemResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { enqueueNewsletterDraft } from '@/server/queue/newsletter.jobs';

// GET /api/admin/newsletter/drafts - List all drafts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !can(session.user, 'read', 'newsletter')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to view newsletter drafts',
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where = status ? { status } : {};

    const [drafts, total] = await Promise.all([
      prisma.newsletterDraft.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.newsletterDraft.count({ where }),
    ]);

    return NextResponse.json({
      drafts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to list newsletter drafts');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to list newsletter drafts',
    });
  }
}

// POST /api/admin/newsletter/drafts - Create new draft or trigger generation
const CreateDraftSchema = z.object({
  generateNow: z.boolean().optional(),
  date: z.string().datetime().optional(),
  manualDraft: z
    .object({
      subject: z.string(),
      intro: z.string(),
      topics: z.array(
        z.object({
          title: z.string(),
          summary: z.string(),
          url: z.string().optional(),
        }),
      ),
      cta: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !can(session.user, 'create', 'newsletter')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to create newsletter drafts',
      });
    }

    const body = await request.json();
    const validation = CreateDraftSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const { generateNow, date, manualDraft } = validation.data;

    if (generateNow) {
      // Trigger AI generation
      const job = await enqueueNewsletterDraft({
        date: date ? new Date(date) : new Date(),
      });

      logger.info(
        {
          userId: session.user.id,
          jobId: job.id,
        },
        'Newsletter draft generation triggered',
      );

      return NextResponse.json(
        {
          jobId: job.id,
          message: 'Newsletter draft generation started',
        },
        { status: 202 },
      );
    }

    if (manualDraft) {
      // Create manual draft
      const draft = await prisma.newsletterDraft.create({
        data: {
          date: date ? new Date(date) : new Date(),
          subject: manualDraft.subject,
          intro: manualDraft.intro,
          topics: manualDraft.topics,
          cta: manualDraft.cta,
          status: 'draft',
        },
      });

      logger.info(
        {
          userId: session.user.id,
          draftId: draft.id,
        },
        'Manual newsletter draft created',
      );

      return NextResponse.json(draft, { status: 201 });
    }

    return createProblemResponse({
      status: 400,
      title: 'Bad Request',
      detail: 'Either generateNow or manualDraft must be provided',
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create newsletter draft');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to create newsletter draft',
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
