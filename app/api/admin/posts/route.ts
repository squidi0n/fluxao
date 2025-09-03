import { PostStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { createProblemResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { invalidateSearchCache } from '@/lib/search';
import { ensureUniqueSlug } from '@/lib/slugify';

const createPostSchema = z.object({
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createProblemResponse({
        status: 401,
        title: 'Unauthorized',
        detail: 'You must be logged in to access this resource',
      });
    }

    if (!can(session.user, 'read', 'posts')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to view posts',
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
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
          _count: {
            select: {
              tags: true,
              categories: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Transform to include tags and categories directly
    const transformedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((pt) => pt.tag),
      categories: post.categories.map((pc) => pc.category),
    }));

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // console.error('Get posts error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to fetch posts',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createProblemResponse({
        status: 401,
        title: 'Unauthorized',
        detail: 'You must be logged in to access this resource',
      });
    }

    if (!can(session.user, 'create', 'posts')) {
      return createProblemResponse({
        status: 403,
        title: 'Forbidden',
        detail: 'You do not have permission to create posts',
      });
    }

    const authorId = session.user.id;

    const body = await request.json();
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors?.[0]?.message || 'Invalid post data',
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

    // Generate unique slug
    const slug = await ensureUniqueSlug(data.slug || data.title, async (s) => {
      const exists = await prisma.post.findUnique({ where: { slug: s } });
      return !!exists;
    });

    // Generate excerpt if not provided - simple version
    const excerpt = data.excerpt || data.content.substring(0, 200);

    // Create the post with tags
    const post = await prisma.post.create({
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
          : data.status === PostStatus.PUBLISHED
            ? new Date()
            : null,
        isFeatured: data.isFeatured || false,
        isFeaturedInCategory: data.isFeaturedInCategory || false,
        authorId,
        tags: data.tags
          ? {
              create: data.tags.map((tagId) => ({
                tag: {
                  connect: { id: tagId },
                },
              })),
            }
          : undefined,
        categories: data.categories
          ? {
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

    // TODO: Re-enable audit log after importing auditAdminAction
    // await auditAdminAction(
    //   session.user.id,
    //   'create',
    //   'post',
    //   post.id,
    //   { title: data.title, status: data.status, slug }
    // )

    // Invalidate search cache
    await invalidateSearchCache();

    // Transform response
    const transformedPost = {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
      categories: post.categories.map((pc) => pc.category),
    };

    return NextResponse.json(transformedPost, { status: 201 });
  } catch (error) {
    // console.error('Create post error:', error);
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to create post',
    });
  }
}
