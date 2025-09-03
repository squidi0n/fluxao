import Parser from 'rss-parser';

import type { NewsletterSource } from '@prisma/client';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const parser = new Parser();

// RSS feed URLs for AI news
const RSS_FEEDS = [
  'https://openai.com/blog/rss.xml',
  'https://www.anthropic.com/rss.xml',
  'https://deepmind.google/blog/rss.xml',
  'https://huggingface.co/blog/feed.xml',
  'https://ai.googleblog.com/feeds/posts/default',
] as const;

export interface SourceCollectionResult {
  collected: number;
  sources: NewsletterSource[];
}

// Collect sources from RSS feeds
export async function collectRssSources(): Promise<NewsletterSource[]> {
  const sources: NewsletterSource[] = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const recentItems = feed.items
        .slice(0, 5) // Take only 5 most recent items per feed
        .filter((item) => {
          // Only include items from last 7 days
          if (!item.pubDate) return false;
          const pubDate = new Date(item.pubDate);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return pubDate > sevenDaysAgo;
        });

      for (const item of recentItems) {
        // Check if already exists
        const existing = await prisma.newsletterSource.findFirst({
          where: {
            type: 'rss',
            url: item.link || item.guid,
          },
        });

        if (!existing) {
          const source = await prisma.newsletterSource.create({
            data: {
              type: 'rss',
              url: item.link || item.guid,
              title: item.title || 'Untitled',
              content: item.contentSnippet || item.content || item.summary,
              metadata: {
                author: item.creator || item.author,
                publishedAt: item.pubDate,
                feedTitle: feed.title,
                categories: item.categories,
              },
              used: false,
            },
          });
          sources.push(source);
        }
      }
    } catch (error) {
      logger.error({ error, feedUrl }, 'Failed to parse RSS feed');
    }
  }

  return sources;
}

// Collect sources from recent blog posts
export async function collectPostSources(): Promise<NewsletterSource[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get recent published posts
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 10,
  });

  const sources: NewsletterSource[] = [];

  for (const post of posts) {
    // Check if already exists as source
    const existing = await prisma.newsletterSource.findFirst({
      where: {
        type: 'post',
        url: `/news/${post.slug}`,
      },
    });

    if (!existing) {
      const source = await prisma.newsletterSource.create({
        data: {
          type: 'post',
          url: `/news/${post.slug}`,
          title: post.title,
          content: post.teaser || post.excerpt || post.content?.slice(0, 500),
          metadata: {
            postId: post.id,
            publishedAt: post.publishedAt?.toISOString(),
            authorId: post.authorId,
          },
          used: false,
        },
      });
      sources.push(source);
    }
  }

  return sources;
}

// Collect all sources
export async function collectAllSources(): Promise<SourceCollectionResult> {
  logger.info('Starting source collection');

  const [rssSources, postSources] = await Promise.all([collectRssSources(), collectPostSources()]);

  const allSources = [...rssSources, ...postSources];

  logger.info(
    {
      rss: rssSources.length,
      posts: postSources.length,
      total: allSources.length,
    },
    'Source collection completed',
  );

  return {
    collected: allSources.length,
    sources: allSources,
  };
}

// Get unused sources for newsletter generation
export async function getUnusedSources(limit = 10): Promise<NewsletterSource[]> {
  return prisma.newsletterSource.findMany({
    where: {
      used: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

// Mark sources as used
export async function markSourcesAsUsed(sourceIds: string[]): Promise<void> {
  await prisma.newsletterSource.updateMany({
    where: {
      id: {
        in: sourceIds,
      },
    },
    data: {
      used: true,
    },
  });
}

// Add manual source
export async function addManualSource(
  title: string,
  content: string,
  url?: string,
  metadata?: any,
): Promise<NewsletterSource> {
  return prisma.newsletterSource.create({
    data: {
      type: 'manual',
      title,
      content,
      url,
      metadata,
      used: false,
    },
  });
}

// Clean old sources
export async function cleanOldSources(daysToKeep = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.newsletterSource.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      used: true,
    },
  });

  logger.info({ deleted: result.count }, 'Cleaned old newsletter sources');
  return result.count;
}
