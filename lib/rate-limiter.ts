import { kv } from '@vercel/kv';

import { logger } from './logger';

interface RateLimitOptions {
  max: number;
  window: number; // in milliseconds
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private inMemoryStore: Map<string, { count: number; reset: number }> = new Map();

  async check(identifier: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    const reset = now + options.window;

    try {
      // Try Redis first if available
      if (process.env.KV_REST_API_URL) {
        return await this.checkWithRedis(key, options, now, reset);
      }
    } catch (error) {
      logger.warn({ error }, 'Redis rate limit check failed, falling back to memory');
    }

    // Fallback to in-memory rate limiting
    return this.checkInMemory(key, options, now, reset);
  }

  private async checkWithRedis(
    key: string,
    options: RateLimitOptions,
    now: number,
    reset: number,
  ): Promise<RateLimitResult> {
    // Get current count and TTL
    const [count, ttl] = await Promise.all([kv.get<number>(key), kv.ttl(key)]);

    const currentCount = count || 0;
    const currentReset = ttl > 0 ? now + ttl * 1000 : reset;

    if (currentCount >= options.max) {
      return {
        success: false,
        limit: options.max,
        remaining: 0,
        reset: currentReset,
      };
    }

    // Increment counter
    const newCount = await kv.incr(key);

    // Set expiry if this is the first request in the window
    if (newCount === 1) {
      await kv.expire(key, Math.ceil(options.window / 1000));
    }

    return {
      success: true,
      limit: options.max,
      remaining: Math.max(0, options.max - newCount),
      reset: currentReset,
    };
  }

  private checkInMemory(
    key: string,
    options: RateLimitOptions,
    now: number,
    reset: number,
  ): RateLimitResult {
    // Clean up expired entries
    this.cleanupExpired(now);

    const entry = this.inMemoryStore.get(key);

    if (!entry || entry.reset < now) {
      // New window
      this.inMemoryStore.set(key, { count: 1, reset });
      return {
        success: true,
        limit: options.max,
        remaining: options.max - 1,
        reset,
      };
    }

    if (entry.count >= options.max) {
      return {
        success: false,
        limit: options.max,
        remaining: 0,
        reset: entry.reset,
      };
    }

    // Increment counter
    entry.count++;
    this.inMemoryStore.set(key, entry);

    return {
      success: true,
      limit: options.max,
      remaining: options.max - entry.count,
      reset: entry.reset,
    };
  }

  private cleanupExpired(now: number): void {
    // Clean up expired entries to prevent memory leak
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (entry.reset < now) {
        this.inMemoryStore.delete(key);
      }
    }

    // Limit total size to prevent unbounded growth
    if (this.inMemoryStore.size > 10000) {
      const entries = Array.from(this.inMemoryStore.entries());
      entries.sort((a, b) => a[1].reset - b[1].reset);

      // Remove oldest half
      const toRemove = entries.slice(0, 5000);
      for (const [key] of toRemove) {
        this.inMemoryStore.delete(key);
      }

      logger.warn({ removed: toRemove.length }, 'Rate limiter cleanup due to size limit');
    }
  }

  async reset(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;

    if (process.env.KV_REST_API_URL) {
      try {
        await kv.del(key);
      } catch (error) {
        logger.warn({ error }, 'Failed to reset rate limit in Redis');
      }
    }

    this.inMemoryStore.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Simplified rate limit function for middleware use
 */
export async function rateLimit(
  identifier: string,
  options: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
  }
): Promise<boolean> {
  try {
    const result = await rateLimiter.check(identifier, {
      max: options.maxRequests,
      window: options.windowMs
    });
    
    return result.success;
  } catch (error) {
    logger.error({ error, identifier }, 'Rate limiting error');
    // Fail open - allow request on error
    return true;
  }
}
