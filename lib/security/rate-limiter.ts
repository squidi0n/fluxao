import { Redis } from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

import { getRedisClient } from '@/lib/redis';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  handler?: (req: NextRequest) => NextResponse;
}

export class RateLimiter {
  private redis: Redis | null;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.redis = getRedisClient();
    this.config = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: this.defaultKeyGenerator,
      handler: this.defaultHandler,
      ...config,
    };
  }

  private defaultKeyGenerator(req: NextRequest): string {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return `rate-limit:${ip}:${req.nextUrl.pathname}`;
  }

  private defaultHandler(req: NextRequest): NextResponse {
    return NextResponse.json(
      { error: this.config.message },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(this.config.windowMs / 1000)),
          'X-RateLimit-Limit': String(this.config.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + this.config.windowMs).toISOString(),
        },
      },
    );
  }

  async check(req: NextRequest): Promise<NextResponse | null> {
    if (!this.redis) {
      // console.warn('Redis not available, rate limiting disabled');
      return null;
    }

    const key = this.config.keyGenerator!(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Remove old entries
      await this.redis.zremrangebyscore(key, '-inf', windowStart);

      // Count requests in current window
      const requestCount = await this.redis.zcard(key);

      if (requestCount >= this.config.max) {
        return this.config.handler!(req);
      }

      // Add current request
      await this.redis.zadd(key, now, `${now}-${Math.random()}`);
      await this.redis.expire(key, Math.ceil(this.config.windowMs / 1000));

      return null; // Request allowed
    } catch (error) {
      // console.error('Rate limiter error:', error);
      return null; // Allow request on error
    }
  }

  async reset(req: NextRequest): Promise<void> {
    if (!this.redis) return;

    const key = this.config.keyGenerator!(req);
    await this.redis.del(key);
  }
}

// Preset configurations
export const rateLimiters = {
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  }),

  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    message: 'Too many authentication attempts, please try again later.',
  }),

  strict: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
  }),

  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: 'Upload limit exceeded, please try again later.',
  }),
};
