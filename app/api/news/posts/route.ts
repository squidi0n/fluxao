import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') ?? 'ki-tech';
    const limit = Math.min(Number(searchParams.get('limit') ?? 9), 50);
    const cursor = searchParams.get('cursor');

    // Build where clause for category filter
    const whereClause: Prisma.PostWhereInput = {
      status: 'PUBLISHED',
      categories: {
        some: {
          category: {
            slug: category,
          },
        },
      },
    };

    // Fetch posts from database with pagination
    const posts = await prisma.post.findMany({
      where: whereClause,
      take: limit + 1, // Fetch one extra to check if there's more
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        publishedAt: 'desc',
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: true,
        publishedAt: true,
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
        viewCount: true,
      },
    });

    // Check if there are more posts
    const hasNext = posts.length > limit;
    const items = hasNext ? posts.slice(0, -1) : posts;
    const nextCursor = hasNext ? items[items.length - 1].id : null;

    // Transform data to match expected format
    const transformedData = items.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      teaser: post.excerpt || '',
      coverUrl: post.coverImage,
      category: post.categories[0]?.category || null,
      tags: post.tags,
      author: post.author
        ? {
            name: post.author.name || 'Anonymous',
            avatarUrl: post.author.image,
          }
        : null,
      publishedAt: post.publishedAt?.toISOString() || new Date().toISOString(),
      commentCount: post._count.comments,
      viewCount: post.viewCount,
    }));

    return NextResponse.json(
      {
        data: transformedData,
        pagination: {
          cursor: nextCursor,
          has_next: hasNext,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          ETag: `"${category}:${cursor ?? 'start'}:${items.length}"`,
        },
      },
    );
  } catch (error) {
    // console.error('Error fetching news posts:', error);

    // Return empty array if no posts found or error occurs
    return NextResponse.json(
      {
        data: [],
        pagination: {
          cursor: null,
          has_next: false,
        },
        error: 'Failed to fetch posts',
      },
      {
        status: 500,
      },
    );
  }
}
