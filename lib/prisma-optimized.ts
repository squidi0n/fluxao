import { Prisma } from '@prisma/client';

import { perfCache, CacheTTL, CacheKeys } from '@/lib/performance-cache';
import { prisma } from '@/lib/prisma';

// Optimized query patterns to avoid N+1 issues

/**
 * Get posts with optimized includes
 */
export async function getOptimizedPosts(
  page: number = 1,
  limit: number = 10,
  options?: {
    includeAuthor?: boolean;
    includeTags?: boolean;
    includeCategories?: boolean;
    includeComments?: boolean;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  },
) {
  const cacheKey = CacheKeys.postsList(page);

  return perfCache.getOrSet(
    cacheKey,
    async () => {
      const skip = (page - 1) * limit;

      // Build optimized include object
      const include: Prisma.PostInclude = {};

      if (options?.includeAuthor) {
        include.author = {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        };
      }

      if (options?.includeTags) {
        include.tags = {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        };
      }

      if (options?.includeCategories) {
        include.categories = {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        };
      }

      if (options?.includeComments) {
        include._count = {
          select: {
            comments: {
              where: {
                status: 'APPROVED',
              },
            },
          },
        };
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            status: options?.status || 'PUBLISHED',
            publishedAt: {
              lte: new Date(),
            },
          },
          include,
          orderBy: {
            publishedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.post.count({
          where: {
            status: options?.status || 'PUBLISHED',
            publishedAt: {
              lte: new Date(),
            },
          },
        }),
      ]);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
    CacheTTL.MEDIUM,
  );
}

/**
 * Get user with optimized includes
 */
export async function getOptimizedUser(
  userId: string,
  options?: {
    includeSubscription?: boolean;
    includeSocialLinks?: boolean;
    includeFollowers?: boolean;
    includeFollowing?: boolean;
    includePosts?: boolean;
  },
) {
  const cacheKey = CacheKeys.user(userId);

  return perfCache.getOrSet(
    cacheKey,
    async () => {
      const include: Prisma.UserInclude = {};

      if (options?.includeSubscription) {
        include.subscription = {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            trialEnd: true,
          },
        };
      }

      if (options?.includeSocialLinks) {
        include.socialLinks = true;
      }

      if (options?.includeFollowers) {
        include._count = {
          select: {
            followers: true,
          },
        };
      }

      if (options?.includeFollowing) {
        include._count = {
          ...include._count,
          select: {
            ...include._count?.select,
            following: true,
          },
        };
      }

      if (options?.includePosts) {
        include.posts = {
          where: {
            status: 'PUBLISHED',
          },
          select: {
            id: true,
            slug: true,
            title: true,
            teaser: true,
            publishedAt: true,
            viewCount: true,
          },
          orderBy: {
            publishedAt: 'desc',
          },
          take: 10,
        };
      }

      return prisma.user.findUnique({
        where: { id: userId },
        include,
      });
    },
    CacheTTL.LONG,
  );
}

/**
 * Batch load users to avoid N+1
 */
export async function batchLoadUsers(userIds: string[]) {
  // Create individual cache keys
  const cacheKeys = userIds.map((id) => CacheKeys.user(id));

  // Try to get from cache first
  const cachedUsers = await perfCache.mget<any>(cacheKeys);

  // Find missing users
  const missingIds: string[] = [];
  const result: any[] = [];

  userIds.forEach((id, index) => {
    if (cachedUsers[index]) {
      result[index] = cachedUsers[index];
    } else {
      missingIds.push(id);
    }
  });

  // Batch load missing users
  if (missingIds.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: missingIds,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
      },
    });

    // Cache the loaded users
    const cacheEntries = users.map((user) => ({
      key: CacheKeys.user(user.id),
      value: user,
      ttl: CacheTTL.LONG,
    }));
    await perfCache.mset(cacheEntries);

    // Merge results
    users.forEach((user) => {
      const index = userIds.indexOf(user.id);
      if (index !== -1) {
        result[index] = user;
      }
    });
  }

  return result;
}

/**
 * Get analytics with optimized aggregations
 */
export async function getOptimizedAnalytics(
  period: 'day' | 'week' | 'month' | 'year',
  options?: {
    includeTopPosts?: boolean;
    includeTopAuthors?: boolean;
    includeTrafficSources?: boolean;
  },
) {
  const cacheKey = CacheKeys.analytics('dashboard', period);

  return perfCache.getOrSet(
    cacheKey,
    async () => {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }

      const promises: Promise<any>[] = [
        // Basic metrics
        prisma.analyticsEvent.groupBy({
          by: ['type'],
          where: {
            createdAt: {
              gte: startDate,
            },
          },
          _count: true,
        }),
      ];

      if (options?.includeTopPosts) {
        promises.push(
          prisma.post.findMany({
            where: {
              publishedAt: {
                gte: startDate,
              },
            },
            select: {
              id: true,
              slug: true,
              title: true,
              viewCount: true,
            },
            orderBy: {
              viewCount: 'desc',
            },
            take: 10,
          }),
        );
      }

      if (options?.includeTopAuthors) {
        promises.push(
          prisma.user.findMany({
            select: {
              id: true,
              name: true,
              username: true,
              _count: {
                select: {
                  posts: {
                    where: {
                      publishedAt: {
                        gte: startDate,
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              posts: {
                _count: 'desc',
              },
            },
            take: 5,
          }),
        );
      }

      if (options?.includeTrafficSources) {
        promises.push(
          prisma.analyticsEvent.groupBy({
            by: ['referrer'],
            where: {
              type: 'pageview',
              createdAt: {
                gte: startDate,
              },
              referrer: {
                not: null,
              },
            },
            _count: true,
            orderBy: {
              _count: {
                referrer: 'desc',
              },
            },
            take: 10,
          }),
        );
      }

      const results = await Promise.all(promises);

      return {
        metrics: results[0],
        topPosts: results[1] || [],
        topAuthors: results[2] || [],
        trafficSources: results[3] || [],
      };
    },
    CacheTTL.SHORT,
  );
}

/**
 * Optimized comment loading with author info
 */
export async function getOptimizedComments(postId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        postId,
        status: 'APPROVED',
      },
      select: {
        id: true,
        authorName: true,
        authorEmail: true,
        body: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.comment.count({
      where: {
        postId,
        status: 'APPROVED',
      },
    }),
  ]);

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Preload and warm cache for frequently accessed data
 */
export async function warmUpCache() {
  // console.log('Warming up cache...');

  const promises = [
    // Preload first page of posts
    getOptimizedPosts(1, 10, {
      includeAuthor: true,
      includeTags: true,
      includeCategories: true,
    }),

    // Preload analytics for today
    getOptimizedAnalytics('day', {
      includeTopPosts: true,
    }),
  ];

  await Promise.all(promises);
  // console.log('Cache warm-up complete');
}

// Export optimized Prisma client with middleware
export const optimizedPrisma = prisma.$extends({
  query: {
    // Add automatic caching for findUnique
    $allModels: {
      async findUnique({ args, query }) {
        const cacheKey = `${this}:${JSON.stringify(args.where)}`;

        const cached = await perfCache.get(cacheKey);
        if (cached) {
          return cached;
        }

        const result = await query(args);
        if (result) {
          await perfCache.set(cacheKey, result, CacheTTL.SHORT);
        }

        return result;
      },
    },
  },
});
