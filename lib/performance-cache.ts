import { LRUCache } from 'lru-cache';

import { cache, CacheTTL } from './cache';
import { logger } from './logger';

// Multi-layer caching with memory and Redis
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory LRU cache for ultra-fast access
const memoryCache = new LRUCache<string, CacheEntry<any>>({
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes default TTL
  updateAgeOnGet: true,
  updateAgeOnHas: true,
  fetchMethod: async (key: string) => {
    // Fallback to Redis when not in memory
    const data = await cache.get(key);
    if (data) {
      cacheStats.redisHits++;
      return {
        data,
        timestamp: Date.now(),
        ttl: CacheTTL.SHORT,
      };
    }
    cacheStats.misses++;
    return undefined;
  },
});

// Performance metrics
const cacheStats = {
  memoryHits: 0,
  redisHits: 0,
  misses: 0,
  errors: 0,
  writes: 0,
  evictions: 0,
};

// Reset stats periodically (every hour)
setInterval(
  () => {
    const total = cacheStats.memoryHits + cacheStats.redisHits + cacheStats.misses;
    if (total > 0) {
      logger.info('Cache performance stats:', {
        ...cacheStats,
        hitRate: (((cacheStats.memoryHits + cacheStats.redisHits) / total) * 100).toFixed(2) + '%',
        memoryHitRate: ((cacheStats.memoryHits / total) * 100).toFixed(2) + '%',
      });
    }
    // Reset counters
    Object.keys(cacheStats).forEach((key) => {
      cacheStats[key as keyof typeof cacheStats] = 0;
    });
  },
  60 * 60 * 1000,
);

export class PerformanceCache {
  /**
   * Get value with multi-layer caching
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      // Try memory cache first
      const memoryEntry = memoryCache.get(key);
      if (memoryEntry) {
        cacheStats.memoryHits++;
        return memoryEntry.data;
      }

      // Fallback to Redis
      const redisData = await cache.get<T>(key);
      if (redisData) {
        cacheStats.redisHits++;
        // Store in memory for faster access
        memoryCache.set(key, {
          data: redisData,
          timestamp: Date.now(),
          ttl: CacheTTL.SHORT,
        });
        return redisData;
      }

      cacheStats.misses++;
      return null;
    } catch (error) {
      cacheStats.errors++;
      logger.error(`Performance cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in both memory and Redis
   */
  async set<T = any>(key: string, value: T, ttl: number = CacheTTL.MEDIUM): Promise<boolean> {
    try {
      cacheStats.writes++;

      // Store in memory cache
      memoryCache.set(
        key,
        {
          data: value,
          timestamp: Date.now(),
          ttl,
        },
        { ttl: ttl * 1000 },
      ); // Convert to milliseconds

      // Store in Redis
      const success = await cache.set(key, value, { ttl });

      return success;
    } catch (error) {
      cacheStats.errors++;
      logger.error(`Performance cache set error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete from both caches
   */
  async del(key: string): Promise<boolean> {
    try {
      memoryCache.delete(key);
      return await cache.del(key);
    } catch (error) {
      cacheStats.errors++;
      logger.error(`Performance cache delete error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      // Clear from memory cache
      let memoryDeleted = 0;
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          memoryCache.delete(key);
          memoryDeleted++;
        }
      }

      // Clear from Redis
      const redisDeleted = await cache.delByPattern(pattern);

      return memoryDeleted + redisDeleted;
    } catch (error) {
      cacheStats.errors++;
      logger.error(`Performance cache invalidate pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetcher();

    // Store in cache
    await this.set(key, fresh, ttl);

    return fresh;
  }

  /**
   * Batch get multiple keys
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];

    for (const key of keys) {
      results.push(await this.get<T>(key));
    }

    return results;
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset<T = any>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean[]> {
    const results: boolean[] = [];

    for (const entry of entries) {
      results.push(await this.set(entry.key, entry.value, entry.ttl || CacheTTL.MEDIUM));
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = cacheStats.memoryHits + cacheStats.redisHits + cacheStats.misses;
    return {
      ...cacheStats,
      total,
      hitRate: total > 0 ? ((cacheStats.memoryHits + cacheStats.redisHits) / total) * 100 : 0,
      memoryHitRate: total > 0 ? (cacheStats.memoryHits / total) * 100 : 0,
      memorySize: memoryCache.size,
      memoryMax: memoryCache.max,
    };
  }

  /**
   * Clear all caches
   */
  async flush(): Promise<boolean> {
    try {
      memoryCache.clear();
      return await cache.flush();
    } catch (error) {
      logger.error('Performance cache flush error:', error);
      return false;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    logger.info(`Warming up cache with ${keys.length} keys`);

    const promises = keys.map(async (key) => {
      const data = await fetcher(key);
      if (data) {
        await this.set(key, data, CacheTTL.LONG);
      }
    });

    await Promise.all(promises);
    logger.info('Cache warm-up complete');
  }
}

// Export singleton instance
export const perfCache = new PerformanceCache();

// Re-export from cache
export { CacheTTL } from './cache';

// Cache strategies for different data types
export const CacheStrategies = {
  // Static content - cache for a long time
  static: {
    ttl: CacheTTL.VERY_LONG,
    staleWhileRevalidate: true,
  },

  // User data - cache for medium duration
  user: {
    ttl: CacheTTL.MEDIUM,
    staleWhileRevalidate: true,
  },

  // Real-time data - cache for short duration
  realtime: {
    ttl: CacheTTL.SHORT,
    staleWhileRevalidate: false,
  },

  // Analytics - cache for medium duration
  analytics: {
    ttl: CacheTTL.LONG,
    staleWhileRevalidate: true,
  },

  // Search results - cache for short duration
  search: {
    ttl: CacheTTL.SHORT,
    staleWhileRevalidate: true,
  },
};
