import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 10);

    // Fetch trending posts (most viewed in last 7 days or with most views overall)
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
      },
      take: limit,
      orderBy: [
        {
          viewCount: 'desc', // Order by view count
        },
        {
          publishedAt: 'desc', // Then by publish date
        },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        publishedAt: true,
        author: {
          select: {
            name: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    // Transform posts for response
    const transformedPosts = posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      publishedAt: post.publishedAt?.toISOString(),
      author: post.author?.name || 'Anonym',
      category: post.categories[0]?.category || null,
    }));

    return NextResponse.json({
      data: transformedPosts,
    });
  } catch (error) {
    // console.error('Error fetching trending posts:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Trending Posts' }, { status: 500 });
  }
}
