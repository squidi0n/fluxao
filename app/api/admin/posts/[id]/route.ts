import { PostStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createProblemResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { invalidateSearchCache } from '@/lib/search';
import { ensureUniqueSlug } from '@/lib/slugify';

const updatePostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  teaser: z.union([z.string().max(500), z.literal('')]).optional(),
  content: z.string().min(1),
  excerpt: z.union([z.string(), z.literal('')]).optional(),
  coverImage: z
    .union([z.string(), z.literal('')])
    .optional()
    .nullable(),
  status: z.nativeEnum(PostStatus),
  publishedAt: z
    .union([z.string(), z.literal('')])
    .optional()
    .nullable(),
  isFeatured: z.boolean().optional(),
  isFeaturedInCategory: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

// PATCH - Quick status update
export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Simple update for status toggle
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.publishedAt !== undefined && {
          publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    // console.error('Update post error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to update post',
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Auth disabled for now
    // const user = await getUserFromCookies()
    //
    // if (!session || !can(session.user, 'read', 'posts')) {
    //   return createProblemResponse({
    //     status: 403,
    //     title: 'Forbidden',
    //     detail: 'You do not have permission to view posts',
    //   })
    // }

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!post) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Post not found',
      });
    }

    // Transform response to include tags directly
    const transformedPost = {
      ...post,
      tags: post.tags.map((pt: any) => pt.tag),
      categories: post.categories.map((pc: any) => pc.category),
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    // console.error('Get post error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to fetch post',
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Auth disabled for now
    // const user = await getUserFromCookies()
    //
    // if (!session || !can(session.user, 'update', 'posts')) {
    //   return createProblemResponse({
    //     status: 403,
    //     title: 'Forbidden',
    //     detail: 'You do not have permission to update posts',
    //   })
    // }

    const body = await request.json();
    const validation = updatePostSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const data = validation.data;

    // Skip MDX validation for now - it's causing issues
    // const mdxValidation = await validateMDX(data.content)
    // if (!mdxValidation.valid) {
    //   return createProblemResponse({
    //     status: 400,
    //     title: 'Invalid MDX',
    //     detail: mdxValidation.error,
    //   })
    // }

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Post not found',
      });
    }

    // Generate unique slug if changed
    let slug = data.slug;
    if (slug && slug !== existingPost.slug) {
      slug = await ensureUniqueSlug(slug, async (s) => {
        if (s === existingPost.slug) return false;
        const exists = await prisma.post.findUnique({ where: { slug: s } });
        return !!exists;
      });
    } else {
      slug = existingPost.slug;
    }

    // Generate excerpt if not provided - simple version
    const excerpt = data.excerpt || data.content.substring(0, 200);

    // Update the post with tags
    const post = await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        teaser: data.teaser || null,
        content: data.content,
        excerpt: excerpt || null,
        coverImage: data.coverImage || null,
        status: data.status,
        publishedAt: data.publishedAt
          ? new Date(data.publishedAt)
          : data.status === PostStatus.PUBLISHED && !existingPost.publishedAt
            ? new Date()
            : existingPost.publishedAt,
        isFeatured: data.isFeatured,
        isFeaturedInCategory: data.isFeaturedInCategory,
        tags: data.tags
          ? {
              deleteMany: {},
              create: data.tags.map((tagId) => ({
                tag: {
                  connect: { id: tagId },
                },
              })),
            }
          : undefined,
        categories: data.categories
          ? {
              deleteMany: {},
              create: data.categories.map((categoryId) => ({
                category: {
                  connect: { id: categoryId },
                },
              })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Audit log disabled for now
    // await auditAdminAction(
    //   session.user.id,
    //   'update',
    //   'post',
    //   post.id,
    //   { title: data.title, status: data.status, previousStatus: existingPost.status }
    // )

    // Invalidate search cache
    await invalidateSearchCache();

    // Transform response
    const transformedPost = {
      ...post,
      tags: post.tags.map((pt: any) => pt.tag),
      categories: post.categories.map((pc: any) => pc.category),
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    // console.error('Update post error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to update post',
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Auth disabled for now
    // const user = await getUserFromCookies()
    //
    // if (!session || !can(session.user, 'delete', 'posts')) {
    //   return createProblemResponse({
    //     status: 403,
    //     title: 'Forbidden',
    //     detail: 'You do not have permission to delete posts',
    //   })
    // }

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return createProblemResponse({
        status: 404,
        title: 'Not Found',
        detail: 'Post not found',
      });
    }

    // Hard delete - actually remove the post
    await prisma.post.delete({
      where: { id },
    });

    // Audit log disabled for now
    // await auditAdminAction(
    //   session.user.id,
    //   'delete',
    //   'post',
    //   existingPost.id,
    //   { title: existingPost.title }
    // )

    // Invalidate search cache
    await invalidateSearchCache();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // console.error('Delete post error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to delete post',
    });
  }
}
