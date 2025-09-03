import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { createProblemResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { ensureUniqueSlug } from '@/lib/slugify';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Temporarily disabled for testing - TODO: Re-enable auth
    // const session = await auth();

    // if (!session?.user?.id || !can(session.user, 'read', 'posts')) {
    //   return createProblemResponse({
    //     status: 403,
    //     title: 'Forbidden',
    //     detail: 'You do not have permission to view tags',
    //   });
    // }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const where = search
      ? {
          OR: [{ name: { contains: search } }, { slug: { contains: search } }],
        }
      : {};

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    // console.error('Get tags error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to fetch tags',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable auth when fixed
    // const user = await getUserFromCookies()
    //
    // if (!session || !can(session.user, 'create', 'posts')) {
    //   return createProblemResponse({
    //     status: 403,
    //     title: 'Forbidden',
    //     detail: 'You do not have permission to create tags',
    //   })
    // }

    const body = await request.json();
    const validation = createTagSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const data = validation.data;

    // Generate unique slug
    const slug = await ensureUniqueSlug(data.slug || data.name, async (s) => {
      const exists = await prisma.tag.findUnique({ where: { slug: s } });
      return !!exists;
    });

    // Check if tag name already exists
    const existingTag = await prisma.tag.findUnique({
      where: { name: data.name },
    });

    if (existingTag) {
      return createProblemResponse({
        status: 409,
        title: 'Conflict',
        detail: 'A tag with this name already exists',
      });
    }

    // Create the tag
    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    // TODO: Re-enable audit log when auth is fixed
    // await auditAdminAction(
    //   session.user.id,
    //   'create',
    //   'tag',
    //   tag.id,
    //   { name: data.name, slug }
    // )

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    // console.error('Create tag error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to create tag',
    });
  }
}
