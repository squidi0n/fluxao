import { Metadata } from 'next';

import CategoryStrip from './components/CategoryStrip';
import HeroFeatured from './components/HeroFeatured';
import NewsletterBand from './components/NewsletterBand';
import TrendingList from './components/TrendingList';

import { prisma } from '@/lib/prisma';
import { generateSeo } from '@/lib/seo';

// Force dynamic rendering to avoid prerendering issues with auth
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = generateSeo({
  title: 'FluxAO – Magazin für KI, Gesellschaft & Zukunft',
  description:
    'Entdecke die neuesten Entwicklungen in KI und Technologie, gesellschaftliche Trends und Zukunftsvisionen. FluxAO ist dein digitales Magazin für Innovation und Wandel.',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004',
});

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      description: `Aktuelle Artikel aus ${cat.name}`,
    }));
  } catch (error) {
    // console.error('Error fetching categories:', error);
    return [];
  }
}

async function getFeaturedPost() {
  try {
    const post = await prisma.post.findFirst({
      where: {
        status: 'PUBLISHED',
        coverImage: {
          not: null,
        },
        publishedAt: {
          lte: new Date(),
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
          take: 1,
        },
      },
    });

    if (!post) return null;

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      subheading: post.teaser,
      coverUrl: post.coverImage!,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt?.toISOString(),
      author: {
        name: post.author?.name || 'Anonym',
        avatarUrl: post.author?.avatar,
      },
      category: post.categories[0]?.category || null,
    };
  } catch (error) {
    // console.error('Error fetching featured post:', error);
    return null;
  }
}

async function getTrendingPosts() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
      },
      take: 6,
      orderBy: [
        {
          viewCount: 'desc',
        },
        {
          publishedAt: 'desc',
        },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        publishedAt: true,
        categories: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    return posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      publishedAt: post.publishedAt?.toISOString(),
      category: post.categories[0]?.category || null,
    }));
  } catch (error) {
    // console.error('Error fetching trending posts:', error);
    return [];
  }
}

async function getCategoryPosts(categorySlug: string, limit = 6) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
        categories: {
          some: {
            category: {
              slug: categorySlug,
            },
          },
        },
      },
      take: limit,
      orderBy: {
        publishedAt: 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
          take: 1,
        },
      },
    });

    return posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      subheading: post.teaser,
      coverUrl: post.coverImage,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt?.toISOString(),
      author: {
        name: post.author?.name || 'Anonym',
        avatarUrl: post.author?.avatar,
      },
      category: post.categories[0]?.category || null,
    }));
  } catch (error) {
    // console.error(`Error fetching posts for category ${categorySlug}:`, error);
    return [];
  }
}

export default async function HomePage() {
  // Fetch categories first
  const categories = await getCategories();

  // Fetch data in parallel
  const [featured, trending, ...categoryPosts] = await Promise.all([
    getFeaturedPost(),
    getTrendingPosts(),
    ...categories.map((cat) => getCategoryPosts(cat.slug)),
  ]);

  // Map category posts to their categories
  const categoryStrips = categories.map((category, index) => ({
    ...category,
    posts: categoryPosts[index] || [],
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Featured Post - 2 columns on desktop */}
            <div className="lg:col-span-2">
              {featured ? (
                <HeroFeatured post={featured} />
              ) : (
                <div className="bg-gray-200 dark:bg-gray-800 rounded-xl aspect-[16/9] animate-pulse" />
              )}
            </div>

            {/* Trending List - 1 column on desktop */}
            <div className="lg:col-span-1">
              <TrendingList posts={trending} />
            </div>
          </div>
        </div>
      </section>

      {/* Category Strips */}
      {categoryStrips.map((category) => (
        <CategoryStrip key={category.slug} category={category} posts={category.posts} />
      ))}

      {/* Newsletter Band */}
      <NewsletterBand />
    </div>
  );
}
