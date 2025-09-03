import { getServerSideSitemap } from 'next-sitemap';

import { config } from '@/lib/config';
import { prisma } from '@/lib/db';

export async function GET() {
  const baseUrl = config.get('BASE_URL');

  // Fetch all published posts
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  // Fetch all categories
  const categories = await prisma.category.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  // Fetch all tags
  const tags = await prisma.tag.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const fields = [
    ...posts.map((post) => ({
      loc: `${baseUrl}/news/${post.slug}`,
      lastmod: post.updatedAt.toISOString(),
      changefreq: 'weekly' as const,
      priority: 0.8,
    })),
    ...categories.map((category) => ({
      loc: `${baseUrl}/news/category/${category.slug}`,
      lastmod: category.updatedAt.toISOString(),
      changefreq: 'weekly' as const,
      priority: 0.6,
    })),
    ...tags.map((tag) => ({
      loc: `${baseUrl}/news/tag/${tag.slug}`,
      lastmod: tag.updatedAt.toISOString(),
      changefreq: 'weekly' as const,
      priority: 0.6,
    })),
  ];

  return getServerSideSitemap(fields);
}
