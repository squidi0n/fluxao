import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import HeroSlider from '@/components/home/HeroSlider';
import CategoryNewsletterForm from '@/components/CategoryNewsletterForm';
import { prisma } from '@/lib/prisma';
import { generateSeo } from '@/lib/seo';
import { getServerCategoryBySlug } from '@/lib/server-categories';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getServerCategoryBySlug(slug);
  if (!category) return {};

  const baseUrl = process.env.BASE_URL || 'https://fluxao.de';
  const canonical = `${baseUrl}/category/${slug}`;
  const description = `${category.description} - Entdecke aktuelle Artikel und News zu ${category.name} auf FluxAO`;

  return {
    title: `${category.name} | FluxAO`,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${category.name} | FluxAO`,
      description: description,
      url: canonical,
      type: 'website',
      images: [{
        url: `${baseUrl}/og-default.png`,
        width: 1200,
        height: 630,
        alt: `${category.name} - FluxAO`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | FluxAO`,
      description: description,
      images: [`${baseUrl}/og-default.png`],
    },
    keywords: `${category.name}, FluxAO, News, Artikel, Technologie, KI`,
  };
}

async function getCategoryPosts(slug: string) {
  try {
    // Get category from database
    const category = await prisma.category.findUnique({
      where: { slug },
    });

    if (!category) return null;

    // Get all posts for this category
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        categories: {
          some: {
            categoryId: category.id,
          },
        },
      },
      include: {
        author: true,
        categories: {
          include: { category: true },
        },
        tags: {
          include: { tag: true },
        },
      },
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
    });

    return { category, posts };
  } catch (error) {
    // // console.error('Error fetching category posts:', error);
    return null;
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCategoryPosts(slug);

  if (!result) {
    notFound();
  }

  const { category, posts } = result;

  // Split posts for slider (top 3) and grid (rest)
  const sliderPosts = posts.slice(0, 3).map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.teaser || '',
    coverImage:
      post.coverImage ||
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop',
    category: category.name,
    author: post.author?.name || 'FluxAO Team',
    publishedAt: post.publishedAt,
    viewCount: post.viewCount,
  }));

  const gridPosts = posts.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Minimaler Header im Kartenstil */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <span className="text-base">📂</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {category.name}
              </h1>
              <p className="text-sm text-gray-600 hidden md:block">
                {category.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-blue-600">
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              📝 {posts.length}
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              👀 {posts.reduce((acc, p) => acc + p.viewCount, 0).toLocaleString('de-DE')}
            </span>
            <Link href={`/category/${category.slug}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
              Alle ansehen <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Slider - Top 3 Posts */}
      {sliderPosts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HeroSlider posts={sliderPosts} noContainer={true} />
        </div>
      )}

      {/* All Other Posts Grid */}
      {gridPosts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Weitere Artikel</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => (
              <Link key={post.id} href={`/${post.slug}`} className="group block">
                <article className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full border border-gray-100 hover:border-purple-200">
                  {post.coverImage && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* No category badge needed - we're already in category context */}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    {(post.excerpt || post.teaser) && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {post.excerpt || post.teaser}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{post.author?.name || 'FluxAO Team'}</span>
                      <div className="flex items-center gap-3">
                        {post.publishedAt && (
                          <time dateTime={post.publishedAt.toISOString()}>
                            {post.publishedAt.toLocaleDateString('de-DE', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </time>
                        )}
                        <span>{post.viewCount} Aufrufe</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Noch keine Artikel in dieser Kategorie
            </h2>
            <p className="text-gray-600 mb-8">
              Schau später nochmal vorbei oder entdecke andere Kategorien
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      )}

      {/* Newsletter CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Verpasse keine {category?.name} News!</h3>
            <p className="mb-6 opacity-90">Erhalte die neuesten Artikel direkt in dein Postfach</p>
            <div className="max-w-md mx-auto">
              <CategoryNewsletterForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
