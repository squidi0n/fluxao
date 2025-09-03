import { Tag, Category } from '@prisma/client';
import { kv } from '@vercel/kv';

import { logger } from './logger';

import { prisma } from '@/lib/db';

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  teaser: string | null;
  excerpt: string | null;
  publishedAt: Date | null;
  tags: Array<{ tag: Tag }>;
  categories: Array<{ category: Category }>;
  matchedSnippet?: string;
}

export interface SearchOptions {
  query: string;
  tags?: string[];
  categories?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  cached: boolean;
  took: number;
}

/**
 * Generate cache key for search query
 */
function getCacheKey(options: SearchOptions): string {
  const parts = [
    'search',
    options.query.toLowerCase().trim(),
    options.tags?.sort().join(',') || '',
    options.categories?.sort().join(',') || '',
    options.limit || 20,
    options.offset || 0,
  ];
  return parts.join(':');
}

/**
 * Extract text snippet around matched terms
 */
function extractSnippet(text: string, query: string, maxLength = 200): string {
  if (!text) return '';

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/).filter((w) => w.length > 2);

  // Find first occurrence of any query word
  let firstMatch = -1;
  for (const word of words) {
    const index = lowerText.indexOf(word);
    if (index !== -1 && (firstMatch === -1 || index < firstMatch)) {
      firstMatch = index;
    }
  }

  if (firstMatch === -1) {
    // No match found, return beginning of text
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  // Extract snippet around match
  const start = Math.max(0, firstMatch - 50);
  const end = Math.min(text.length, firstMatch + maxLength - 50);
  let snippet = text.substring(start, end);

  // Add ellipsis if needed
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  // Highlight matched words
  for (const word of words) {
    const regex = new RegExp(`(${word})`, 'gi');
    snippet = snippet.replace(regex, '**$1**');
  }

  return snippet;
}

/**
 * Search posts with caching
 */
export async function searchPosts(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();
  const cacheKey = getCacheKey(options);

  try {
    // Check cache first (only in production or if Redis is configured)
    if (process.env.KV_REST_API_URL) {
      const cached = await kv.get<SearchResponse>(cacheKey);
      if (cached) {
        logger.debug({ cacheKey }, 'Search cache hit');
        return {
          ...cached,
          cached: true,
          took: Date.now() - startTime,
        };
      }
    }
  } catch (error) {
    logger.warn({ error }, 'Cache read error, falling back to database');
  }

  // Prepare search terms
  const searchTerms = options.query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Build where clause
  const where: any = {
    status: 'PUBLISHED',
    publishedAt: {
      lte: new Date(),
    },
  };

  // Add search conditions - SQLite doesn't support case-insensitive search, so convert to lowercase
  if (searchTerms.length > 0) {
    where.OR = searchTerms.flatMap((term) => [
      { title: { contains: term.toLowerCase() } },
      { content: { contains: term.toLowerCase() } },
      { teaser: { contains: term.toLowerCase() } },
    ]);
  }

  // Add tag filter
  if (options.tags && options.tags.length > 0) {
    where.tags = {
      some: {
        tag: {
          slug: {
            in: options.tags,
          },
        },
      },
    };
  }

  // Add category filter
  if (options.categories && options.categories.length > 0) {
    where.categories = {
      some: {
        category: {
          slug: {
            in: options.categories,
          },
        },
      },
    };
  }

  // Execute search
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        // Prioritize title matches
        { title: 'asc' },
        { publishedAt: 'desc' },
      ],
      take: options.limit || 20,
      skip: options.offset || 0,
    }),
    prisma.post.count({ where }),
  ]);

  // Process results and add snippets
  const results: SearchResult[] = posts.map((post) => {
    // Extract snippet from content
    let matchedSnippet: string | undefined;
    if (searchTerms.length > 0) {
      // Check title first
      const titleMatch = searchTerms.some((term) => post.title.toLowerCase().includes(term));

      if (titleMatch) {
        matchedSnippet = post.teaser || extractSnippet(post.content, options.query);
      } else {
        matchedSnippet = extractSnippet(post.content, options.query);
      }
    }

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      teaser: post.teaser,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      tags: post.tags,
      categories: post.categories,
      matchedSnippet,
    };
  });

  // Sort results by relevance
  results.sort((a, b) => {
    const aScore = calculateRelevance(a, searchTerms);
    const bScore = calculateRelevance(b, searchTerms);
    return bScore - aScore;
  });

  const response: SearchResponse = {
    results,
    total,
    query: options.query,
    cached: false,
    took: Date.now() - startTime,
  };

  // Cache the results (TTL: 5 minutes)
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(cacheKey, response, { ex: 300 });
      logger.debug({ cacheKey }, 'Search results cached');
    } catch (error) {
      logger.warn({ error }, 'Cache write error');
    }
  }

  return response;
}

/**
 * Calculate relevance score for sorting
 */
function calculateRelevance(result: SearchResult, searchTerms: string[]): number {
  let score = 0;
  const lowerTitle = result.title.toLowerCase();
  const lowerTeaser = (result.teaser || '').toLowerCase();

  for (const term of searchTerms) {
    // Title match is worth more
    if (lowerTitle.includes(term)) {
      score += 10;
      // Exact title match is worth even more
      if (lowerTitle === term) {
        score += 20;
      }
    }

    // Teaser match
    if (lowerTeaser.includes(term)) {
      score += 5;
    }

    // Tag match
    if (result.tags.some((t) => t.tag.name.toLowerCase().includes(term))) {
      score += 3;
    }
  }

  // Recency bonus (posts from last 30 days)
  if (result.publishedAt) {
    const daysSincePublished = Math.floor(
      (Date.now() - result.publishedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSincePublished < 30) {
      score += Math.max(0, 5 - daysSincePublished / 6);
    }
  }

  return score;
}

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
  if (query.length < 2) return [];

  const cacheKey = `suggestions:${query.toLowerCase()}`;

  // Check cache
  if (process.env.KV_REST_API_URL) {
    try {
      const cached = await kv.get<string[]>(cacheKey);
      if (cached) return cached;
    } catch (error) {
      logger.warn({ error }, 'Suggestions cache read error');
    }
  }

  // Get unique titles that match
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      title: {
        contains: query.toLowerCase(),
      },
    },
    select: { title: true },
    take: limit,
  });

  const suggestions = posts.map((p) => p.title);

  // Cache suggestions (TTL: 1 hour)
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(cacheKey, suggestions, { ex: 3600 });
    } catch (error) {
      logger.warn({ error }, 'Suggestions cache write error');
    }
  }

  return suggestions;
}

/**
 * Invalidate search cache for specific queries or all
 */
export async function invalidateSearchCache(patterns?: string[]): Promise<void> {
  if (!process.env.KV_REST_API_URL) return;

  try {
    if (!patterns || patterns.length === 0) {
      // Clear all search cache
      const keys = await kv.keys('search:*');
      if (keys.length > 0) {
        await kv.del(...keys);
        logger.info({ count: keys.length }, 'Cleared all search cache');
      }

      // Also clear suggestions
      const suggestionKeys = await kv.keys('suggestions:*');
      if (suggestionKeys.length > 0) {
        await kv.del(...suggestionKeys);
        logger.info({ count: suggestionKeys.length }, 'Cleared all suggestions cache');
      }
    } else {
      // Clear specific patterns
      for (const pattern of patterns) {
        const keys = await kv.keys(`search:${pattern}*`);
        if (keys.length > 0) {
          await kv.del(...keys);
          logger.info({ pattern, count: keys.length }, 'Cleared search cache for pattern');
        }
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed to invalidate search cache');
  }
}

/**
 * Warm up cache with common searches
 */
export async function warmSearchCache(): Promise<void> {
  if (!process.env.KV_REST_API_URL) return;

  const commonSearches = ['nextjs', 'react', 'typescript', 'tutorial', 'guide', 'best practices'];

  for (const query of commonSearches) {
    try {
      await searchPosts({ query, limit: 10 });
      logger.debug({ query }, 'Warmed search cache');
    } catch (error) {
      logger.warn({ error, query }, 'Failed to warm cache');
    }
  }
}
