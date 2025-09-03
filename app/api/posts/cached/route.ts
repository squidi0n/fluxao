import { NextRequest, NextResponse } from 'next/server';

import { CacheTTL } from '@/lib/cache';
import { withCache, setCacheHeaders } from '@/lib/cache-middleware';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

interface PostsQuery {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
}

async function getPostsData(query: PostsQuery) {
  const { page = 1, limit = 12, category, tag, author, search } = query;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    status: 'PUBLISHED',
    publishedAt: { not: null },
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

  if (tag) {
    where.tags = {
      some: {
        tag: {
          slug: tag,
        },
      },
    };
  }

  if (author) {
    where.author = {
      username: author,
    };
  }

  if (search) {
    const lowerSearch = search.toLowerCase();
    where.OR = [
      { title: { contains: lowerSearch } },
      { teaser: { contains: lowerSearch } },
      { content: { contains: lowerSearch } },
    ];
  }

  // Get posts and total count in parallel
  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
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
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                status: 'APPROVED',
              },
            },
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }],
      take: limit,
      skip,
    }),

    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      teaser: post.teaser,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      viewCount: post.viewCount,
      author: post.author,
      categories: post.categories.map((c) => c.category),
      tags: post.tags.map((t) => t.tag),
      commentsCount: post._count.comments,
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Cached GET handler
const cachedHandler = withCache({
  ttl: CacheTTL.MEDIUM, // 30 minutes
  keyGenerator: (req) => {
    const url = new URL(req.url);
    const params = url.searchParams;
    const queryParams = [
      `page=${params.get('page') || '1'}`,
      `limit=${params.get('limit') || '12'}`,
      params.get('category') && `category=${params.get('category')}`,
      params.get('tag') && `tag=${params.get('tag')}`,
      params.get('author') && `author=${params.get('author')}`,
      params.get('search') && `search=${params.get('search')}`,
    ]
      .filter(Boolean)
      .join('&');

    return `api:posts:list:${queryParams}`;
  },
  shouldCache: (req, res) => {
    // Only cache successful GET requests without search
    const url = new URL(req.url);
    const hasSearch = url.searchParams.get('search');
    return req.method === 'GET' && res.status === 200 && !hasSearch;
  },
})(async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const query: PostsQuery = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '12', 10), 50),
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      author: searchParams.get('author') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const data = await getPostsData(query);

    const response = NextResponse.json(data);

    // Set appropriate cache headers
    if (!query.search) {
      setCacheHeaders(response, {
        maxAge: 300, // 5 minutes
        staleWhileRevalidate: 600, // 10 minutes
        public: true,
      });
    } else {
      // Don't cache search results
      setCacheHeaders(response, {
        noCache: true,
      });
    }

    return response;
  } catch (error) {
    logger.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
});

export const GET = cachedHandler;
