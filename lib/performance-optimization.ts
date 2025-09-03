/**
 * Performance Optimization System
 * Advanced caching, query optimization, and performance monitoring
 */

import { prisma } from './prisma';
import { logger } from './logger';
import { cache } from './cache';

// Cache configuration
export const CACHE_CONFIG = {
  // Cache TTL values (in seconds)
  TTL: {
    STATIC_CONTENT: 3600, // 1 hour
    DYNAMIC_CONTENT: 300, // 5 minutes
    USER_SESSION: 1800, // 30 minutes
    DATABASE_QUERIES: 600, // 10 minutes
    API_RESPONSES: 120, // 2 minutes
    NEWSLETTER_DATA: 900, // 15 minutes
  },

  // Cache keys
  KEYS: {
    POSTS_PUBLISHED: 'posts:published',
    POSTS_TRENDING: 'posts:trending',
    CATEGORIES: 'categories:all',
    NEWSLETTER_STATS: 'newsletter:stats',
    USER_PROFILE: (id: string) => `user:profile:${id}`,
    POST_DETAIL: (slug: string) => `post:detail:${slug}`,
    ANALYTICS: (type: string) => `analytics:${type}`,
  }
} as const;

// Performance metrics
interface PerformanceMetrics {
  queryTime: number;
  cacheHitRate: number;
  totalQueries: number;
  slowQueries: number;
  averageResponseTime: number;
}

/**
 * Query Optimizer - Optimizes database queries with caching and batching
 */
export class QueryOptimizer {
  private static metrics: PerformanceMetrics = {
    queryTime: 0,
    cacheHitRate: 0,
    totalQueries: 0,
    slowQueries: 0,
    averageResponseTime: 0
  };

  /**
   * Get published posts with optimized caching
   */
  static async getPublishedPosts(options: {
    limit?: number;
    offset?: number;
    category?: string;
    useCache?: boolean;
  } = {}) {
    const { limit = 10, offset = 0, category, useCache = true } = options;
    const cacheKey = `${CACHE_CONFIG.KEYS.POSTS_PUBLISHED}:${limit}:${offset}:${category || 'all'}`;

    if (useCache) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        this.recordCacheHit();
        return cached;
      }
    }

    const startTime = Date.now();

    try {
      const whereClause: any = {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date()
        }
      };

      if (category) {
        whereClause.categories = {
          some: {
            category: {
              slug: category
            }
          }
        };
      }

      const posts = await prisma.post.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: [
          { publishedAt: 'desc' },
          { viewCount: 'desc' }
        ],
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          viewCount: true,
          estimatedReadTime: true,
          author: {
            select: {
              name: true,
              avatar: true,
              username: true
            }
          },
          categories: {
            select: {
              category: {
                select: {
                  name: true,
                  slug: true
                }
              }
            },
            take: 1
          }
        }
      });

      const optimizedPosts = posts.map(post => ({
        ...post,
        category: post.categories[0]?.category || null,
        categories: undefined // Remove to reduce payload
      }));

      const queryTime = Date.now() - startTime;
      this.recordQuery(queryTime);

      if (useCache) {
        await cache.set(cacheKey, optimizedPosts, { ttl: CACHE_CONFIG.TTL.DYNAMIC_CONTENT });
        this.recordCacheMiss();
      }

      return optimizedPosts;

    } catch (error) {
      logger.error({ error, options }, 'Failed to fetch published posts');
      throw error;
    }
  }

  /**
   * Get trending posts with advanced scoring
   */
  static async getTrendingPosts(limit: number = 5) {
    const cacheKey = `${CACHE_CONFIG.KEYS.POSTS_TRENDING}:${limit}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      this.recordCacheHit();
      return cached;
    }

    const startTime = Date.now();

    try {
      // Advanced trending algorithm considering multiple factors
      const posts = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            lte: new Date()
          }
        },
        take: limit * 2, // Get more to filter properly
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          viewCount: true,
          fluxCount: true,
          estimatedReadTime: true,
          author: {
            select: {
              name: true,
              avatar: true,
              username: true
            }
          },
          categories: {
            select: {
              category: {
                select: {
                  name: true,
                  slug: true
                }
              }
            },
            take: 1
          },
          _count: {
            select: {
              comments: true,
              articleVotes: true
            }
          }
        }
      });

      // Calculate trending score
      const trendingPosts = posts
        .map(post => {
          const ageInHours = (Date.now() - (post.publishedAt?.getTime() || 0)) / (1000 * 60 * 60);
          const recencyWeight = Math.max(0, 1 - (ageInHours / 168)); // Decay over week
          
          const trendingScore = 
            (post.viewCount * 0.3) +
            (post.fluxCount * 0.2) +
            (post._count.comments * 0.3) +
            (post._count.articleVotes * 0.2) * recencyWeight;

          return {
            ...post,
            trendingScore,
            category: post.categories[0]?.category || null,
            commentCount: post._count.comments,
            voteCount: post._count.articleVotes,
            categories: undefined,
            _count: undefined
          };
        })
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);

      const queryTime = Date.now() - startTime;
      this.recordQuery(queryTime);

      await cache.set(cacheKey, trendingPosts, { ttl: CACHE_CONFIG.TTL.DYNAMIC_CONTENT });
      this.recordCacheMiss();

      return trendingPosts;

    } catch (error) {
      logger.error({ error, limit }, 'Failed to fetch trending posts');
      throw error;
    }
  }

  /**
   * Get post by slug with caching
   */
  static async getPostBySlug(slug: string, includeContent: boolean = true) {
    const cacheKey = CACHE_CONFIG.KEYS.POST_DETAIL(slug);
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      this.recordCacheHit();
      return cached;
    }

    const startTime = Date.now();

    try {
      const post = await prisma.post.findUnique({
        where: {
          slug,
          status: 'PUBLISHED'
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              bio: true
            }
          },
          categories: {
            include: {
              category: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          ...(includeContent && {
            comments: {
              where: {
                status: 'APPROVED'
              },
              take: 10,
              orderBy: {
                createdAt: 'desc'
              },
              include: {
                author: {
                  select: {
                    name: true,
                    avatar: true
                  }
                }
              }
            }
          })
        }
      });

      if (!post) {
        return null;
      }

      // Update view count asynchronously (don't wait)
      this.updateViewCount(post.id);

      const optimizedPost = {
        ...post,
        categoryList: post.categories.map(pc => pc.category),
        tagList: post.tags.map(pt => pt.tag),
        categories: undefined,
        tags: undefined
      };

      const queryTime = Date.now() - startTime;
      this.recordQuery(queryTime);

      await cache.set(cacheKey, optimizedPost, { ttl: CACHE_CONFIG.TTL.STATIC_CONTENT });
      this.recordCacheMiss();

      return optimizedPost;

    } catch (error) {
      logger.error({ error, slug }, 'Failed to fetch post by slug');
      throw error;
    }
  }

  /**
   * Get categories with caching
   */
  static async getCategories() {
    const cached = await cache.get(CACHE_CONFIG.KEYS.CATEGORIES);
    if (cached) {
      this.recordCacheHit();
      return cached;
    }

    const startTime = Date.now();

    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              posts: {
                where: {
                  post: {
                    status: 'PUBLISHED'
                  }
                }
              }
            }
          }
        }
      });

      const optimizedCategories = categories.map(category => ({
        ...category,
        postCount: category._count.posts,
        _count: undefined
      }));

      const queryTime = Date.now() - startTime;
      this.recordQuery(queryTime);

      await cache.set(CACHE_CONFIG.KEYS.CATEGORIES, optimizedCategories, { 
        ttl: CACHE_CONFIG.TTL.STATIC_CONTENT 
      });
      this.recordCacheMiss();

      return optimizedCategories;

    } catch (error) {
      logger.error({ error }, 'Failed to fetch categories');
      throw error;
    }
  }

  /**
   * Update view count asynchronously
   */
  private static async updateViewCount(postId: string) {
    try {
      await prisma.post.update({
        where: { id: postId },
        data: {
          viewCount: {
            increment: 1
          }
        }
      });

      // Invalidate related caches
      await this.invalidatePostCaches(postId);

    } catch (error) {
      logger.error({ error, postId }, 'Failed to update view count');
    }
  }

  /**
   * Invalidate post-related caches
   */
  static async invalidatePostCaches(postId?: string) {
    try {
      await cache.delByPattern('posts:*');
      await cache.delByPattern('post:detail:*');
      
      if (postId) {
        // Get post slug to invalidate specific cache
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { slug: true }
        });
        
        if (post) {
          await cache.del(CACHE_CONFIG.KEYS.POST_DETAIL(post.slug));
        }
      }
    } catch (error) {
      logger.error({ error, postId }, 'Failed to invalidate post caches');
    }
  }

  /**
   * Performance monitoring methods
   */
  private static recordQuery(queryTime: number) {
    this.metrics.totalQueries++;
    this.metrics.queryTime += queryTime;
    this.metrics.averageResponseTime = this.metrics.queryTime / this.metrics.totalQueries;
    
    if (queryTime > 1000) { // Slow query threshold: 1 second
      this.metrics.slowQueries++;
      logger.warn({ queryTime, threshold: 1000 }, 'Slow database query detected');
    }
  }

  private static recordCacheHit() {
    // Update cache hit rate calculation would go here
    this.metrics.cacheHitRate = Math.min(this.metrics.cacheHitRate + 0.01, 1);
  }

  private static recordCacheMiss() {
    // Update cache miss rate calculation would go here
    this.metrics.cacheHitRate = Math.max(this.metrics.cacheHitRate - 0.01, 0);
  }

  /**
   * Get performance metrics
   */
  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  static resetMetrics() {
    this.metrics = {
      queryTime: 0,
      cacheHitRate: 0,
      totalQueries: 0,
      slowQueries: 0,
      averageResponseTime: 0
    };
  }
}

/**
 * Response compression helper
 */
export class ResponseOptimizer {
  /**
   * Compress JSON response
   */
  static compressJson(data: any): string {
    try {
      // Remove null values and undefined
      const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
        if (value === null || value === undefined) return undefined;
        return value;
      }));

      return JSON.stringify(cleaned);
    } catch (error) {
      logger.error({ error }, 'Failed to compress JSON response');
      return JSON.stringify(data);
    }
  }

  /**
   * Paginate results with optimization
   */
  static paginate<T>(
    items: T[], 
    page: number = 1, 
    limit: number = 10
  ): {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const total = items.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      items: items.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  }
}

/**
 * Database optimization utilities
 */
export class DatabaseOptimizer {
  /**
   * Batch database operations
   */
  static async batchOperations<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 10
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Optimize Prisma query for large datasets
   */
  static async streamLargeDataset<T>(
    query: (cursor?: any) => Promise<T[]>,
    batchSize: number = 100,
    processor: (items: T[]) => Promise<void>
  ): Promise<void> {
    let cursor: any = undefined;
    let hasMore = true;

    while (hasMore) {
      const items = await query(cursor);
      
      if (items.length === 0) {
        hasMore = false;
        break;
      }

      await processor(items);

      if (items.length < batchSize) {
        hasMore = false;
      } else {
        // Set cursor to last item for next iteration
        cursor = (items[items.length - 1] as any).id;
      }
    }
  }
}

/**
 * Initialize performance optimization
 */
export function initializePerformanceOptimization() {
  logger.info('Initializing performance optimization system');

  // Set up periodic cache cleanup
  setInterval(async () => {
    try {
      // Clear expired cache entries
      await cache.flush(); // This would ideally only clear expired entries
      logger.debug('Periodic cache cleanup completed');
    } catch (error) {
      logger.error({ error }, 'Cache cleanup error');
    }
  }, 30 * 60 * 1000); // Every 30 minutes

  // Log performance metrics periodically
  setInterval(() => {
    const metrics = QueryOptimizer.getMetrics();
    logger.info({ metrics }, 'Performance metrics update');
  }, 5 * 60 * 1000); // Every 5 minutes

  logger.info('Performance optimization system initialized');
}