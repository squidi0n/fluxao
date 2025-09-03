import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auditAdminAction } from '@/lib/audit';
import { createProblemResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { ensureUniqueSlug } from '@/lib/slugify';

const updateTagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();

    if (!session || !can(session.user, 'read', 'posts')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to view tags',
      });
    }

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!tag) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Tag not found',
      });
    }

    // Transform response
    const transformedTag = {
      ...tag,
      posts: tag.posts.map((pt) => pt.post),
    };

    return NextResponse.json(transformedTag);
  } catch (error) {
    // console.error('Get tag error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to fetch tag',
    });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();

    if (!session || !can(session.user, 'update', 'posts')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to update tags',
      });
    }

    const body = await request.json();
    const validation = updateTagSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const data = validation.data;

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Tag not found',
      });
    }

    // Check if name is taken by another tag
    if (data.name !== existingTag.name) {
      const nameTaken = await prisma.tag.findUnique({
        where: { name: data.name },
      });

      if (nameTaken) {
        return createProblemResponse({
          status: 409,
          title: 'Conflict',
          detail: 'A tag with this name already exists',
        });
      }
    }

    // Generate unique slug if changed
    let slug = data.slug;
    if (slug && slug !== existingTag.slug) {
      slug = await ensureUniqueSlug(slug, async (s) => {
        if (s === existingTag.slug) return false;
        const exists = await prisma.tag.findUnique({ where: { slug: s } });
        return !!exists;
      });
    } else if (!slug && data.name !== existingTag.name) {
      // Generate new slug from name if name changed and no slug provided
      slug = await ensureUniqueSlug(data.name, async (s) => {
        if (s === existingTag.slug) return false;
        const exists = await prisma.tag.findUnique({ where: { slug: s } });
        return !!exists;
      });
    } else {
      slug = existingTag.slug;
    }

    // Update the tag
    const tag = await prisma.tag.update({
      where: { id },
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

    // Audit log
    await auditAdminAction(session.user.id, 'update', 'tag', tag.id, {
      name: data.name,
      slug,
      previousName: existingTag.name,
    });

    return NextResponse.json(tag);
  } catch (error) {
    // console.error('Update tag error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to update tag',
    });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    // Auth temporarily disabled for testing
    // const user = await getUserFromCookies()
    //
    // if (!session || !can(session.user, 'delete', 'posts')) {
    //   return createProblemResponse({
    //     status: 403,
    //     title: 'Forbidden',
    //     detail: 'You do not have permission to delete tags',
    //   })
    // }

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!existingTag) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Tag not found',
      });
    }

    // If tag is in use, remove it from all posts first
    if (existingTag._count.posts > 0) {
      await prisma.postTag.deleteMany({
        where: { tagId: id },
      });
    }

    // Delete the tag
    await prisma.tag.delete({
      where: { id },
    });

    // Audit log disabled for now
    // await auditAdminAction(
    //   session.user.id,
    //   'delete',
    //   'tag',
    //   id,
    //   { name: existingTag.name }
    // )

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // console.error('Delete tag error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to delete tag',
    });
  }
}
