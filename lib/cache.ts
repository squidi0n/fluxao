const CACHE_DURATION = 60 * 1000; // 1 minute

export enum CacheTTL {
  SHORT = 30 * 1000, // 30 seconds
  MEDIUM = 60 * 1000, // 1 minute
  LONG = 300 * 1000, // 5 minutes
  HOUR = 3600 * 1000, // 1 hour
  VERY_LONG = 24 * 3600 * 1000, // 24 hours
}

export enum CacheKeys {
  POSTS = 'posts',
  TAGS = 'tags',
  CATEGORIES = 'categories',
  USERS = 'users',
  STATS = 'stats',
}

// Extended cache interface for compatibility with performance cache
interface CacheInterface {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, options?: { ttl?: number }): Promise<boolean>;
  del(key: string): Promise<boolean>;
  delByPattern(pattern: string): Promise<number>;
  flush(): Promise<boolean>;
}

class MapBasedCache implements CacheInterface {
  private cacheMap = new Map<string, { data: any; timestamp: number }>();

  async get<T = any>(key: string): Promise<T | null> {
    const cached = this.cacheMap.get(key);
    if (!cached) return null;

    // Basic TTL check (could be improved)
    const duration = CACHE_DURATION;
    if (Date.now() - cached.timestamp > duration) {
      this.cacheMap.delete(key);
      return null;
    }

    return cached.data;
  }

  async set<T = any>(key: string, value: T, options?: { ttl?: number }): Promise<boolean> {
    try {
      this.cacheMap.set(key, { data: value, timestamp: Date.now() });
      return true;
    } catch {
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    return this.cacheMap.delete(key);
  }

  async delByPattern(pattern: string): Promise<number> {
    let deletedCount = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cacheMap.keys()) {
      if (regex.test(key)) {
        this.cacheMap.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  async flush(): Promise<boolean> {
    this.cacheMap.clear();
    return true;
  }

  // Utility methods for backward compatibility
  getSync(key: string, ttl?: number) {
    const cached = this.cacheMap.get(key);
    if (!cached) return null;

    const duration = ttl || CACHE_DURATION;
    if (Date.now() - cached.timestamp > duration) {
      this.cacheMap.delete(key);
      return null;
    }

    return cached.data;
  }

  setSync(key: string, data: any, ttl?: number) {
    this.cacheMap.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cacheMap.clear();
  }

  get size() {
    return this.cacheMap.size;
  }

  keys() {
    return this.cacheMap.keys();
  }
}

// Export cache instance
export const cache = new MapBasedCache();

// Utility functions for backward compatibility
export function getCache(key: string, ttl?: number) {
  return cache.getSync(key, ttl);
}

export function setCache(key: string, data: any, ttl?: number) {
  cache.setSync(key, data, ttl);
}

export function clearCache() {
  cache.clear();
}

export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
