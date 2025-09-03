import { NextRequest, NextResponse } from 'next/server';
import RSS from 'rss';

import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest) {
  try {
    const baseUrl = config.get('BASE_URL');

    // Create RSS feed
    const feed = new RSS({
      title: 'FluxAO - Tech & AI Magazin',
      description: 'Die neuesten Entwicklungen in KI und Technologie',
      feed_url: `${baseUrl}/rss.xml`,
      site_url: baseUrl,
      image_url: `${baseUrl}/logo.png`,
      managingEditor: 'redaktion@fluxao.com (FluxAO Redaktion)',
      webMaster: 'tech@fluxao.com (FluxAO Tech Team)',
      copyright: `© ${new Date().getFullYear()} FluxAO. Alle Rechte vorbehalten.`,
      language: 'de-DE',
      categories: ['Technology', 'AI', 'Artificial Intelligence', 'Tech', 'Innovation'],
      pubDate: new Date().toISOString(),
      ttl: 60, // Cache for 60 minutes
      custom_namespaces: {
        content: 'http://purl.org/rss/1.0/modules/content/',
        atom: 'http://www.w3.org/2005/Atom',
      },
      custom_elements: [
        {
          'atom:link': {
            _attr: {
              href: `${baseUrl}/rss.xml`,
              rel: 'self',
              type: 'application/rss+xml',
            },
          },
        },
      ],
    });

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

    // Add posts to feed
    posts.forEach((post) => {
      const postUrl = `${baseUrl}/news/${post.slug}`;
      const categories = post.categories.map((cat) => cat.category.name);
      const tags = post.tags.map((tag) => tag.tag.name);

      // Create content with proper HTML
      let content = post.content;

      // If content is markdown, convert basic formatting to HTML
      if (content && !content.includes('<')) {
        // Simple markdown to HTML conversion for basic formatting
        content = content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code>$1</code>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');

        content = `<p>${content}</p>`;
      }

      feed.item({
        title: post.title,
        description: post.teaser || extractTextFromHtml(content).substring(0, 200) + '...',
        url: postUrl,
        guid: post.id,
        categories: [...categories, ...tags],
        author: post.author.name || 'FluxAO Team',
        date: post.publishedAt || post.createdAt,
        custom_elements: [
          { 'content:encoded': content },
          { author: post.author.email || 'redaktion@fluxao.com' },
        ],
      });
    });

    const xml = feed.xml({ indent: true });

    logger.info({ postCount: posts.length }, 'RSS feed generated');

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    logger.error({ error }, 'RSS feed generation error');

    // Return a basic error RSS feed
    const errorFeed = new RSS({
      title: 'FluxAO - Error',
      description: 'Error generating RSS feed',
      feed_url: `${config.get('BASE_URL')}/rss.xml`,
      site_url: config.get('BASE_URL'),
      language: 'de-DE',
    });

    const xml = errorFeed.xml({ indent: true });

    return new NextResponse(xml, {
      status: 500,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
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
    .trim();
}

// Support HEAD requests for RSS feed validation
export async function HEAD(_request: NextRequest) {
  return new NextResponse(null, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
