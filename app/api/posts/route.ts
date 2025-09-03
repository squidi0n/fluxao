import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const cursor = searchParams.get('cursor');

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date(),
      },
    };

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    // Fetch posts with cursor-based pagination
    const posts = await prisma.post.findMany({
      where,
      take: limit + 1, // Fetch one extra to check if there are more
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        publishedAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Check if there are more posts
    const hasNext = posts.length > limit;
    const items = hasNext ? posts.slice(0, -1) : posts;

    // Transform posts for response
    const transformedPosts = items.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      subheading: post.teaser,
      coverUrl: post.coverImage,
      excerpt: post.excerpt,
      readMinutes: Math.max(1, Math.ceil((post.content?.length || 0) / 1000)),
      publishedAt: post.publishedAt?.toISOString(),
      author: post.author
        ? {
            name: post.author.name || 'Anonym',
            avatarUrl: post.author.avatar,
          }
        : null,
      categories: post.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
      })),
      tags: post.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
    }));

    // Get next cursor
    const nextCursor = hasNext ? items[items.length - 1].id : null;

    return NextResponse.json({
      data: transformedPosts,
      pagination: {
        cursor: nextCursor,
        has_next: hasNext,
      },
    });
  } catch (error) {
    // console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      teaser,
      coverImage,
      categoryId,
      tagIds,
      authorId,
      status = 'DRAFT',
    } = body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        teaser,
        coverImage,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        authorId,
        categories: categoryId
          ? {
              create: {
                categoryId,
              },
            }
          : undefined,
        tags: tagIds
          ? {
              create: tagIds.map((tagId: string) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        author: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    // console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
