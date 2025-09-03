import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { cache, CacheKeys } from '@/lib/cache';
import { CacheInvalidator } from '@/lib/cache-middleware';
import { logger } from '@/lib/logger';
import { PrismaCache } from '@/lib/prisma-cache';

// GET /api/admin/cache - Get cache statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get cache statistics
    const [prismaStats, redisConnected] = await Promise.all([
      PrismaCache.getStats(),
      Promise.resolve(cache.isConnected),
    ]);

    // Get memory usage if available
    let memoryUsage = null;
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const mem = process.memoryUsage();
        memoryUsage = {
          rss: Math.round(mem.rss / 1024 / 1024), // MB
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024), // MB
          external: Math.round(mem.external / 1024 / 1024), // MB
        };
      }
    } catch (error) {
      logger.warn('Could not get memory usage:', error);
    }

    const stats = {
      redis: {
        connected: redisConnected,
        status: redisConnected ? 'healthy' : 'disconnected',
      },
      prisma: prismaStats,
      memory: memoryUsage,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    return NextResponse.json({ error: 'Failed to get cache statistics' }, { status: 500 });
  }
}

// POST /api/admin/cache - Cache management operations
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, target, pattern } = body;

    let result: any = { success: false };

    switch (action) {
      case 'clear_all':
        const flushed = await cache.flush();
        result = {
          success: flushed,
          message: flushed ? 'All cache cleared' : 'Failed to clear cache',
        };
        break;

      case 'clear_pattern':
        if (!pattern) {
          return NextResponse.json(
            { error: 'Pattern is required for clear_pattern action' },
            { status: 400 },
          );
        }
        const deletedCount = await cache.delByPattern(pattern);
        result = {
          success: deletedCount > 0,
          deletedCount,
          message: `Cleared ${deletedCount} cache entries matching pattern: ${pattern}`,
        };
        break;

      case 'clear_model':
        if (!target) {
          return NextResponse.json(
            { error: 'Target model is required for clear_model action' },
            { status: 400 },
          );
        }
        const modelDeleted = await PrismaCache.clearModel(target);
        result = {
          success: modelDeleted > 0,
          deletedCount: modelDeleted,
          message: `Cleared ${modelDeleted} cache entries for model: ${target}`,
        };
        break;

      case 'invalidate_user':
        if (!target) {
          return NextResponse.json(
            { error: 'User ID is required for invalidate_user action' },
            { status: 400 },
          );
        }
        await CacheInvalidator.invalidateUser(target);
        result = {
          success: true,
          message: `Invalidated cache for user: ${target}`,
        };
        break;

      case 'invalidate_post':
        if (!target) {
          return NextResponse.json(
            { error: 'Post slug is required for invalidate_post action' },
            { status: 400 },
          );
        }
        await CacheInvalidator.invalidatePost(target);
        result = {
          success: true,
          message: `Invalidated cache for post: ${target}`,
        };
        break;

      case 'invalidate_analytics':
        await CacheInvalidator.invalidateAnalytics();
        result = {
          success: true,
          message: 'Invalidated analytics cache',
        };
        break;

      case 'invalidate_monetization':
        await CacheInvalidator.invalidateMonetization();
        result = {
          success: true,
          message: 'Invalidated monetization cache',
        };
        break;

      case 'warm_cache':
        // Warm up cache with common queries
        await warmUpCache();
        result = {
          success: true,
          message: 'Cache warmed up with common queries',
        };
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    logger.info(`Cache management action performed`, {
      action,
      target,
      pattern,
      userId: session.user.id,
      result: result.success,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error performing cache management action:', error);
    return NextResponse.json({ error: 'Cache management action failed' }, { status: 500 });
  }
}

// DELETE /api/admin/cache - Clear specific cache keys
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Cache key is required' }, { status: 400 });
    }

    const deleted = await cache.del(key);

    return NextResponse.json({
      success: deleted,
      message: deleted ? `Deleted cache key: ${key}` : `Cache key not found: ${key}`,
    });
  } catch (error) {
    logger.error('Error deleting cache key:', error);
    return NextResponse.json({ error: 'Failed to delete cache key' }, { status: 500 });
  }
}

// Warm up cache with common queries
async function warmUpCache() {
  const warmupQueries = [
    // Recent posts
    () =>
      cache.set(
        'api:posts:list:page=1&limit=12',
        'warmup-placeholder',
        { ttl: 60 }, // Short TTL for warmup
      ),

    // User stats
    () => cache.set(CacheKeys.newsletterSubscribers(), 'warmup-placeholder', { ttl: 60 }),
  ];

  await Promise.allSettled(warmupQueries.map((query) => query()));
}
