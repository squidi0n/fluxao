import { NextRequest, NextResponse } from 'next/server';

import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// JSON Feed specification types
interface JSONFeed {
  version: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  description: string;
  user_comment?: string;
  next_url?: string;
  icon?: string;
  favicon?: string;
  authors?: Author[];
  language?: string;
  items: JSONFeedItem[];
}

interface Author {
  name: string;
  url?: string;
  avatar?: string;
}

interface JSONFeedItem {
  id: string;
  url: string;
  title: string;
  content_html?: string;
  content_text?: string;
  summary?: string;
  image?: string;
  banner_image?: string;
  date_published: string;
  date_modified?: string;
  authors?: Author[];
  tags?: string[];
  language?: string;
  attachments?: Attachment[];
}

interface Attachment {
  url: string;
  mime_type: string;
  title?: string;
  size_in_bytes?: number;
  duration_in_seconds?: number;
}

export async function GET(_request: NextRequest) {
  try {
    const baseUrl = config.get('BASE_URL');

    // Get recent published posts
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50, // Limit to last 50 posts
    });

    // Create JSON Feed
    const feed: JSONFeed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'FluxAO - Tech & AI Magazin',
      home_page_url: baseUrl,
      feed_url: `${baseUrl}/feed.json`,
      description: 'Die neuesten Entwicklungen in KI und Technologie',
      user_comment: 'FluxAO JSON Feed - Folgen Sie uns für die neuesten Tech- und AI-Nachrichten',
      icon: `${baseUrl}/icon-512.png`,
      favicon: `${baseUrl}/favicon.ico`,
      language: 'de-DE',
      authors: [
        {
          name: 'FluxAO Team',
          url: `${baseUrl}/about`,
        },
      ],
      items: posts.map((post): JSONFeedItem => {
        const postUrl = `${baseUrl}/news/${post.slug}`;
        const categories = post.categories.map((cat) => cat.category.name);
        const tags = post.tags.map((tag) => tag.tag.name);
        const allTags = [...categories, ...tags];

        // Process content
        let contentHtml = post.content || '';
        let contentText = extractTextFromHtml(contentHtml);

        // If content looks like markdown, convert basic formatting to HTML
        if (contentHtml && !contentHtml.includes('<')) {
          contentHtml = convertMarkdownToHtml(contentHtml);
          contentText = extractTextFromHtml(contentHtml);
        }

        return {
          id: post.id,
          url: postUrl,
          title: post.title,
          content_html: contentHtml,
          content_text: contentText,
          summary: post.teaser || contentText.substring(0, 200) + '...',
          date_published: (post.publishedAt || post.createdAt).toISOString(),
          date_modified: post.updatedAt.toISOString(),
          authors: [
            {
              name: post.author.name || 'FluxAO Team',
              url: `${baseUrl}/about`,
            },
          ],
          tags: allTags.length > 0 ? allTags : undefined,
          language: 'de-DE',
        };
      }),
    };

    logger.info({ postCount: posts.length }, 'JSON feed generated');

    return NextResponse.json(feed, {
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    logger.error({ error }, 'JSON feed generation error');

    // Return a basic error JSON feed
    const errorFeed: JSONFeed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'FluxAO - Error',
      home_page_url: config.get('BASE_URL'),
      feed_url: `${config.get('BASE_URL')}/feed.json`,
      description: 'Error generating JSON feed',
      language: 'de-DE',
      items: [],
    };

    return NextResponse.json(errorFeed, {
      status: 500,
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

// Helper function to extract plain text from HTML
function extractTextFromHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities (basic)
    .trim();
}

// Helper function to convert basic Markdown to HTML
function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  return (
    markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')

      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')

      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

      // Code
      .replace(/`([^`]+)`/g, '<code>$1</code>')

      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

      // Wrap in paragraph tags
      .replace(/^(?!<[h|u|o])/gm, '<p>')
      .replace(/(?<![>])$/gm, '</p>')

      // Clean up empty paragraphs and fix nested tags
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6]>)/g, '$1')
      .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
  );
}

// Support HEAD requests for JSON feed validation
export async function HEAD(_request: NextRequest) {
  return new NextResponse(null, {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
