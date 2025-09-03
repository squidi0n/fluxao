import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/logger';
import { rateLimiter } from '@/lib/rate-limiter';
import { searchPosts, getSearchSuggestions } from '@/lib/search';

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  tags: z.string().optional(),
  categories: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  suggestions: z.coerce.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0';

    const rateLimitResult = await rateLimiter.check(ip, {
      max: 30, // 30 requests
      window: 60 * 1000, // per minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        },
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = searchSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.format() },
        { status: 400 },
      );
    }

    const { q, tags, categories, limit, offset, suggestions } = validation.data;

    // Return suggestions if requested
    if (suggestions) {
      const results = await getSearchSuggestions(q, 10);
      return NextResponse.json(
        { suggestions: results },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        },
      );
    }

    // Perform search
    const searchOptions = {
      query: q,
      tags: tags ? tags.split(',').filter((t) => t.length > 0) : undefined,
      categories: categories ? categories.split(',').filter((c) => c.length > 0) : undefined,
      limit,
      offset,
    };

    const results = await searchPosts(searchOptions);

    // Add rate limit headers
    const headers: HeadersInit = {
      'X-RateLimit-Limit': String(rateLimitResult.limit),
      'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      'X-RateLimit-Reset': String(rateLimitResult.reset),
    };

    // Add cache headers for non-cached responses
    if (!results.cached) {
      headers['Cache-Control'] = 'public, s-maxage=60, stale-while-revalidate=120';
    } else {
      headers['X-Cache'] = 'HIT';
    }

    // Log search analytics
    logger.info(
      {
        query: q,
        results: results.total,
        cached: results.cached,
        took: results.took,
        ip,
      },
      'Search performed',
    );

    return NextResponse.json(results, { headers });
  } catch (error) {
    logger.error({ error }, 'Search error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
