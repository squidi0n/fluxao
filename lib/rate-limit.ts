import { NextRequest } from 'next/server';

import { config } from './config';
import { RateLimitError } from './errors';

// Simple in-memory rate limiter for Edge Runtime
// In production, consider using Upstash Redis or similar
class EdgeRateLimiter {
  private storage = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async consume(key: string): Promise<void> {
    const now = Date.now();
    const record = this.storage.get(key);

    // Clean up old entries periodically
    if (this.storage.size > 10000) {
      for (const [k, v] of this.storage.entries()) {
        if (v.resetTime < now) {
          this.storage.delete(k);
        }
      }
    }

    if (!record || record.resetTime < now) {
      // Create new record
      this.storage.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return;
    }

    if (record.count >= this.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new RateLimitError(retryAfter);
    }

    // Increment count
    record.count++;
    this.storage.set(key, record);
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const now = Date.now();
    const record = this.storage.get(key);

    if (!record || record.resetTime < now) {
      return null;
    }

    return record;
  }
}

// Create rate limiter instance
const rateLimiter = new EdgeRateLimiter(
  config.getRateLimitConfig().maxRequests,
  config.getRateLimitConfig().windowMs,
);

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    // Get first IP from comma-separated list
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a generic identifier (not ideal for production)
  return 'anonymous';
}

/**
 * Rate limit middleware
 */
export async function checkRateLimit(request: NextRequest): Promise<void> {
  // Skip rate limiting in development
  if (config.isDevelopment()) {
    return;
  }

  const clientId = getClientId(request);
  await rateLimiter.consume(clientId);
}

/**
 * Get rate limit status for a client
 */
export async function getRateLimitStatus(request: NextRequest): Promise<{
  remaining: number;
  reset: Date;
  limit: number;
}> {
  const clientId = getClientId(request);
  const record = await rateLimiter.get(clientId);
  const { maxRequests } = config.getRateLimitConfig();

  if (record) {
    const remaining = Math.max(0, maxRequests - record.count);
    return {
      remaining,
      reset: new Date(record.resetTime),
      limit: maxRequests,
    };
  }

  // Default status
  return {
    remaining: maxRequests,
    reset: new Date(Date.now() + config.getRateLimitConfig().windowMs),
    limit: maxRequests,
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  status: { remaining: number; reset: Date; limit: number },
): void {
  response.headers.set('X-RateLimit-Limit', String(status.limit));
  response.headers.set('X-RateLimit-Remaining', String(status.remaining));
  response.headers.set('X-RateLimit-Reset', status.reset.toISOString());
}

/**
 * Simple rate limiter factory for API routes
 */
export function rateLimit(options: { interval: number; uniqueTokenPerInterval?: number }) {
  const tokens = new Map<string, number[]>();

  return {
    async check(identifier: string, limit: number): Promise<void> {
      const now = Date.now();
      const timestamps = tokens.get(identifier) || [];

      // Filter out old timestamps
      const validTimestamps = timestamps.filter((t) => now - t < options.interval);

      if (validTimestamps.length >= limit) {
        throw new Error('Too many requests');
      }

      validTimestamps.push(now);
      tokens.set(identifier, validTimestamps);

      // Clean up old entries
      if (tokens.size > (options.uniqueTokenPerInterval || 500)) {
        const oldestAllowed = now - options.interval;
        for (const [key, value] of tokens.entries()) {
          const filtered = value.filter((t) => t > oldestAllowed);
          if (filtered.length === 0) {
            tokens.delete(key);
          } else {
            tokens.set(key, filtered);
          }
        }
      }
    },
  };
}
