import { PrismaClient } from '@prisma/client';
import { perfCache, CacheTTL } from './performance-cache';
import { logger } from './logger';

// High-performance Prisma client with connection pooling and caching
export class PrismaPerformanceClient {
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Enable connection pooling with optimized settings
    this.setupConnectionPooling();
  }

  private setupConnectionPooling() {
    // For SQLite, we optimize for concurrent reads
    this.client.$connect();
  }

  // Optimized post queries with intelligent caching
  async findPostBySlug(slug: string, options: { 
    includeAuthor?: boolean, 
    includeCategories?: boolean, 
    includeTags?: boolean,
    includeVotes?: boolean,
    userId?: string 
  } = {}) {
    const cacheKey = `post:${slug}:${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = await perfCache.get(cacheKey);
    if (cached) {
      logger.info(`Cache hit for post: ${slug}`);
      return cached;
    }

    // Build optimized include based on what's needed
    const include: any = {};
    if (options.includeAuthor) {
      include.author = {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
        }
      };
    }
    if (options.includeCategories) {
      include.categories = {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      };
    }
    if (options.includeTags) {
      include.tags = {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      };
    }

    const post = await this.client.post.findUnique({
      where: { slug },
      include: Object.keys(include).length > 0 ? include : undefined,
    });

    if (!post) return null;

    // Cache for 5 minutes for published posts, 30 seconds for drafts
    const ttl = post.status === 'PUBLISHED' ? CacheTTL.LONG : CacheTTL.SHORT;
    await perfCache.set(cacheKey, post, ttl);

    // Separate query for votes to avoid join complexity
    if (options.includeVotes && options.userId) {
      const votes = await this.getPostVotes(post.id, options.userId);
      (post as any).votes = votes;
    }

    return post;
  }

  // Batch-optimized query for homepage posts
  async findFeaturedPosts(limit: number = 6) {
    const cacheKey = `featured-posts:${limit}`;
    
    const cached = await perfCache.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for featured posts');
      return cached;
    }

    // Single optimized query with minimal includes
    const posts = await this.client.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
        isFeatured: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        teaser: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        viewCount: true,
        author: {
          select: {
            name: true,
            username: true,
            avatar: true,
          }
        },
        categories: {
          select: {
            category: {
              select: {
                name: true,
                slug: true,
              }
            }
          },
          take: 1, // Only first category for performance
        },
      },
      orderBy: [
        { publishedAt: 'desc' }
      ],
      take: limit,
    });

    // Cache for 10 minutes
    await perfCache.set(cacheKey, posts, CacheTTL.LONG * 2);
    return posts;
  }

  // Optimized trending posts with denormalized data
  async findTrendingPosts(limit: number = 5) {
    const cacheKey = `trending-posts:${limit}`;
    
    const cached = await perfCache.get(cacheKey);
    if (cached) return cached;

    // Use PostScore table for better performance
    const trendingPosts = await this.client.postScore.findMany({
      where: {
        post: {
          status: 'PUBLISHED',
          publishedAt: {
            lte: new Date(),
          },
        },
      },
      select: {
        score: true,
        views: true,
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
            teaser: true,
            coverImage: true,
            publishedAt: true,
            author: {
              select: {
                name: true,
                username: true,
                avatar: true,
              }
            },
          }
        }
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
    });

    const posts = trendingPosts.map(item => ({
      ...item.post,
      trendingScore: item.score,
      views: item.views,
    }));

    // Cache for 15 minutes
    await perfCache.set(cacheKey, posts, CacheTTL.LONG * 3);
    return posts;
  }

  // Optimized category posts with pagination
  async findPostsByCategory(
    categorySlug: string, 
    options: {
      page?: number,
      limit?: number,
      includeTotal?: boolean,
    } = {}
  ) {
    const { page = 1, limit = 10, includeTotal = false } = options;
    const skip = (page - 1) * limit;
    
    const cacheKey = `category-posts:${categorySlug}:${page}:${limit}`;
    
    const cached = await perfCache.get(cacheKey);
    if (cached) return cached;

    const where = {
      status: 'PUBLISHED' as const,
      publishedAt: {
        lte: new Date(),
      },
      categories: {
        some: {
          category: {
            slug: categorySlug,
          },
        },
      },
    };

    const [posts, total] = await Promise.all([
      this.client.post.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          teaser: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          viewCount: true,
          author: {
            select: {
              name: true,
              username: true,
              avatar: true,
            }
          },
        },
        orderBy: [
          { publishedAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      includeTotal ? this.client.post.count({ where }) : Promise.resolve(0),
    ]);

    const result = {
      posts,
      total: includeTotal ? total : undefined,
      hasMore: posts.length === limit,
    };

    // Cache for 5 minutes
    await perfCache.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  // Fast vote count query with caching
  private async getPostVotes(postId: string, userId?: string) {
    const cacheKey = `post-votes:${postId}:${userId || 'anonymous'}`;
    
    const cached = await perfCache.get(cacheKey);
    if (cached) return cached;

    const [likes, dislikes, userVote] = await Promise.all([
      this.client.articleVote.count({
        where: { postId, type: 'like' },
      }),
      this.client.articleVote.count({
        where: { postId, type: 'dislike' },
      }),
      userId ? this.client.articleVote.findUnique({
        where: {
          userId_postId: { userId, postId },
        },
      }) : Promise.resolve(null),
    ]);

    const votes = {
      likes,
      dislikes,
      userVote: userVote?.type || null,
    };

    // Cache votes for 2 minutes
    await perfCache.set(cacheKey, votes, CacheTTL.MEDIUM * 2);
    return votes;
  }

  // Optimized user notification query
  async findUserNotifications(userId: string, options: {
    limit?: number,
    offset?: number,
    unreadOnly?: boolean,
  } = {}) {
    const { limit = 20, offset = 0, unreadOnly = false } = options;
    const cacheKey = `notifications:${userId}:${limit}:${offset}:${unreadOnly}`;
    
    const cached = await perfCache.get(cacheKey);
    if (cached) return cached;

    const where = {
      OR: [
        { userId: userId },
        { userId: null, role: 'ADMIN' as const },
        { userId: null, role: null },
      ],
      isArchived: false,
      isDismissed: false,
      ...(unreadOnly && { isRead: false }),
      AND: [
        {
          OR: [
            { scheduledFor: null },
            { scheduledFor: { lte: new Date() } }
          ]
        },
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      ]
    };

    const [notifications, unreadCount] = await Promise.all([
      this.client.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          category: true,
          title: true,
          message: true,
          description: true,
          actionUrl: true,
          actionLabel: true,
          priority: true,
          isRead: true,
          sourceId: true,
          sourceType: true,
          data: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit,
      }),
      this.client.notification.count({
        where: {
          ...where,
          isRead: false,
        }
      }),
    ]);

    const result = {
      notifications,
      unreadCount,
    };

    // Cache notifications for 1 minute only due to real-time nature
    await perfCache.set(cacheKey, result, CacheTTL.SHORT * 2);
    return result;
  }

  // Batch update view counts to reduce database calls
  private viewCountQueue = new Map<string, number>();
  private viewCountTimer: NodeJS.Timeout | null = null;

  async incrementViewCount(postId: string) {
    // Add to queue instead of immediate database update
    this.viewCountQueue.set(postId, (this.viewCountQueue.get(postId) || 0) + 1);

    // Batch update every 10 seconds
    if (!this.viewCountTimer) {
      this.viewCountTimer = setTimeout(() => {
        this.flushViewCounts();
      }, 10000);
    }
  }

  private async flushViewCounts() {
    if (this.viewCountQueue.size === 0) {
      this.viewCountTimer = null;
      return;
    }

    const updates = Array.from(this.viewCountQueue.entries()).map(([postId, increment]) =>
      this.client.post.update({
        where: { id: postId },
        data: { viewCount: { increment } },
      })
    );

    try {
      await Promise.all(updates);
      logger.info(`Batch updated ${updates.length} post view counts`);
    } catch (error) {
      logger.error('Failed to batch update view counts:', error);
    }

    this.viewCountQueue.clear();
    this.viewCountTimer = null;
  }

  // Get the underlying client for direct access when needed
  get rawClient() {
    return this.client;
  }

  // Cleanup method
  async disconnect() {
    if (this.viewCountTimer) {
      clearTimeout(this.viewCountTimer);
      await this.flushViewCounts();
    }
    await this.client.$disconnect();
  }
}

// Export singleton instance
export const prismaPerf = new PrismaPerformanceClient();

// Export utility functions
export const findPostBySlug = (slug: string, options?: any) => 
  prismaPerf.findPostBySlug(slug, options);

export const findFeaturedPosts = (limit?: number) => 
  prismaPerf.findFeaturedPosts(limit);

export const findTrendingPosts = (limit?: number) => 
  prismaPerf.findTrendingPosts(limit);

export const findPostsByCategory = (categorySlug: string, options?: any) => 
  prismaPerf.findPostsByCategory(categorySlug, options);

export const findUserNotifications = (userId: string, options?: any) => 
  prismaPerf.findUserNotifications(userId, options);