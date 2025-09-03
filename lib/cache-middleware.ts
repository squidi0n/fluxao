import { NextRequest, NextResponse } from 'next/server';

import { getCache, setCache, clearCache } from './cache';

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: NextRequest) => string;
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean;
}

export function withCache(options: CacheOptions = {}) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const cacheKey = options.keyGenerator ? options.keyGenerator(req) : req.url;
      const cached = getCache(cacheKey);

      if (cached) {
        return NextResponse.json(cached);
      }

      const response = await handler(req);

      if (options.shouldCache && !options.shouldCache(req, response)) {
        return response;
      }

      const data = await response.json();
      setCache(cacheKey, data, options.ttl);

      return NextResponse.json(data);
    };
  };
}

export class CacheInvalidator {
  static invalidatePattern(pattern: string) {
    // For now, just clear all cache
    clearCache();
  }

  static invalidateAll() {
    clearCache();
  }
}

interface CacheHeaderOptions {
  maxAge?: number;
  staleWhileRevalidate?: number;
  public?: boolean;
  noCache?: boolean;
}

export function setCacheHeaders(response: NextResponse, options: CacheHeaderOptions) {
  if (options.noCache) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else {
    const directives = [];
    if (options.public) directives.push('public');
    if (options.maxAge) directives.push(`max-age=${options.maxAge}`);
    if (options.staleWhileRevalidate)
      directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    response.headers.set('Cache-Control', directives.join(', '));
  }
  return response;
}
