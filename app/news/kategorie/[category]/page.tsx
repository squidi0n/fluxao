import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerCategories, getServerCategoryBySlug } from '@/lib/server-categories';
import PostCard from '@/components/PostCard';
import FeaturedPost from '@/components/FeaturedPost';
import NewsletterSignup from '@/components/NewsletterSignup';
import LoadMoreButton from './LoadMoreButton';

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Generate static params for all categories
export async function generateStaticParams() {
  const categories = await getServerCategories();
  return categories.map((category) => ({
    category: category.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getServerCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: 'Kategorie nicht gefunden',
    };
  }

  return {
    title: `${category.name} - FluxAO Magazin`,
    description: category.description || `Aktuelle Artikel zu ${category.name}`,
    openGraph: {
      title: `${category.name} - FluxAO Magazin`,
      description: category.description || `Aktuelle Artikel zu ${category.name}`,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004'}/news/${category.slug}`,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004'}/og-default.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} - FluxAO`,
      description: category.description || `Aktuelle Artikel zu ${category.name}`,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004'}/news/${category.slug}`,
    },
  };
}

// Fetch initial posts (server-side)
async function getInitialPosts(category: string) {
  try {
    // Use mock API for now
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/news/posts?category=${category}&limit=9`,
      {
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    // Return empty data on error
    return { data: [], pagination: { cursor: null, has_next: false } };
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  const category = await getServerCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const { data: posts, pagination } = await getInitialPosts(categorySlug);

  // Find featured post or use the first one
  const featuredPost = posts.find((post: any) => post.isFeatured) || posts[0];
  const gridPosts = posts.filter((post: any) => post.id !== featuredPost?.id);

  // JSON-LD for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} Artikel`,
    description: category.description,
    itemListElement: posts.map((post: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004'}/news/${post.slug}`,
      name: post.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Start
              </Link>
            </li>
            <li>
              <span className="text-gray-400 dark:text-gray-500">/</span>
            </li>
            <li>
              <Link
                href="/news/ki-tech"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Kategorien
              </Link>
            </li>
            <li>
              <span className="text-gray-400 dark:text-gray-500">/</span>
            </li>
            <li>
              <span className="text-gray-900 dark:text-white font-medium" aria-current="page">
                {category.name}
              </span>
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {category.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">{category.description}</p>
        </div>

        {/* Featured Post (Desktop only) */}
        {featuredPost && (
          <div className="hidden md:block mb-12">
            <FeaturedPost post={featuredPost} />
          </div>
        )}

        {/* Posts Grid */}
        {gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {gridPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Noch keine Artikel in dieser Kategorie.
            </p>
          </div>
        ) : null}

        {/* Load More Button */}
        {pagination.has_next && (
          <LoadMoreButton initialCursor={pagination.cursor} category={categorySlug} />
        )}
      </div>

      {/* Newsletter Signup */}
      <NewsletterSignup />
    </>
  );
}
