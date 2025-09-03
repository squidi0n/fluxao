import { Metadata } from 'next';
import HeroSlider from '@/components/home/HeroSlider';
import CategoryStrip from '@/components/home/CategoryStrip';
import NewsletterBand from '@/components/home/NewsletterBand';
import StatsBreak from '@/components/home/StatsBreak';
import QuoteBreak from '@/components/home/QuoteBreak';
import RandomQuote from '@/components/home/RandomQuote';
import TechStackBreak from '@/components/home/TechStackBreak';
import TrendingList from '@/components/home/TrendingList';
import CategoryTabs from '@/components/CategoryTabs';
import { prisma } from '@/lib/prisma';
import { generateSeo } from '@/lib/seo';
import { getServerCategories } from '@/lib/server-categories';

export const metadata: Metadata = {
  title: 'FluxAO – Magazin für KI, Gesellschaft & Zukunft',
  description: 'Entdecke die neuesten Entwicklungen in KI und Technologie, gesellschaftliche Trends und Zukunftsvisionen. FluxAO ist dein digitales Magazin für Innovation.',
  alternates: {
    canonical: process.env.BASE_URL || 'https://fluxao.de',
  },
  openGraph: {
    title: 'FluxAO – Magazin für KI, Gesellschaft & Zukunft',
    description: 'Entdecke die neuesten Entwicklungen in KI und Technologie, gesellschaftliche Trends und Zukunftsvisionen. FluxAO ist dein digitales Magazin für Innovation.',
    url: process.env.BASE_URL || 'https://fluxao.de',
    siteName: 'FluxAO',
    type: 'website',
    images: [{
      url: (process.env.BASE_URL || 'https://fluxao.de') + '/og-default.png',
      width: 1200,
      height: 630,
      alt: 'FluxAO - Magazin für KI und Zukunft',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FluxAO – Magazin für KI, Gesellschaft & Zukunft',
    description: 'Entdecke die neuesten Entwicklungen in KI und Technologie, gesellschaftliche Trends und Zukunftsvisionen.',
    images: [(process.env.BASE_URL || 'https://fluxao.de') + '/og-default.png'],
  },
  keywords: 'KI, Künstliche Intelligenz, Technologie, Innovation, Gesellschaft, Zukunft, AI, Tech News, Deutschland',
  authors: [{ name: 'FluxAO Team' }],
  publisher: 'FluxAO',
};


async function getHeroSlides(categorySlugs: string[]) {
  try {
    // Optimized: Single query with WHERE IN clause instead of N+1 queries
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
        categories: {
          some: {
            category: {
              slug: {
                in: categorySlugs
              },
            },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
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
      take: 6, // Limit to 6 posts maximum
    });

    // Group posts by category and take the first from each
    const categoryMap = new Map();
    const slides: any[] = [];
    
    for (const post of posts) {
      const categorySlug = post.categories[0]?.category.slug;
      if (categorySlug && !categoryMap.has(categorySlug) && slides.length < 6) {
        categoryMap.set(categorySlug, true);
        slides.push(post);
      }
    }

    // Format for slider
    return slides.map((post) => ({
      id: post.id,
      title: post.title,
      teaser: post.teaser || post.excerpt || '',
      coverImage: post.coverImage || '',
      slug: post.slug,
      category: {
        name: post.categories[0]?.category.name || 'Uncategorized',
        slug: post.categories[0]?.category.slug || 'uncategorized',
      },
      author: post.author
        ? {
            name: post.author.name || 'Anonym',
            avatar: post.author.avatar || undefined,
          }
        : undefined,
      publishedAt: post.publishedAt || new Date(),
      viewCount: post.viewCount,
    }));
  } catch (error) {
    // // console.error('Error fetching hero slides:', error);
    return [];
  }
}

async function getFeaturedPost() {
  try {
    // First, try to find a manually featured post
    let post = await prisma.post.findFirst({
      where: {
        status: 'PUBLISHED',
        isFeatured: true,
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

    // If no featured post, get the latest post with cover image
    if (!post) {
      post = await prisma.post.findFirst({
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
    }

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
    // // console.error('Error fetching featured post:', error);
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
    // // console.error('Error fetching trending posts:', error);
    return [];
  }
}

async function getCategoryPosts(categorySlug: string, limit = 3) {
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
    // // console.error(`Error fetching posts for category ${categorySlug}:`, error);
    return [];
  }
}

// Optimized function to get all category posts in one query
async function getAllCategoryPosts(categories: any[]) {
  try {
    const categorySlugs = categories.map(cat => cat.slug);
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
        categories: {
          some: {
            category: {
              slug: {
                in: categorySlugs
              }
            }
          }
        }
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
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Group posts by category
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.slug, []);
    });

    posts.forEach(post => {
      const categorySlug = post.categories[0]?.category.slug;
      if (categorySlug && categoryMap.has(categorySlug)) {
        const categoryPosts = categoryMap.get(categorySlug);
        if (categoryPosts.length < 3) { // Limit to 3 posts per category
          categoryPosts.push({
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
          });
        }
      }
    });

    return Array.from(categoryMap.values());
  } catch (error) {
    // // console.error('Error fetching category posts:', error);
    return categories.map(() => []);
  }
}

// Dynamic layout component for rotating break sections
// Optimized with memoization and efficient rendering
function DynamicCategoryLayout({ categoryStrips }: { categoryStrips: any[] }) {
  // Available break components in rotation order - optimized constant
  const breakComponents = [
    { component: StatsBreak, name: 'StatsBreak' },
    { component: RandomQuote, name: 'RandomQuote' },
    { component: TechStackBreak, name: 'TechStackBreak' },
    { component: QuoteBreak, name: 'QuoteBreak' },
  ] as const;

  // Early return for empty state - performance optimization
  if (!categoryStrips.length) {
    return (
      <div className="relative">
        <div className="animate-fade-in-up text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">
            Keine Kategorien verfügbar. Bald wird hier spannender Content erscheinen!
          </p>
        </div>
        {/* Always show newsletter band at the end */}
        <div className="animate-fade-in-up">
          <NewsletterBand />
        </div>
      </div>
    );
  }

  // Pre-calculate constants for better performance
  const categoryCount = categoryStrips.length;
  const breakComponentCount = breakComponents.length;
  
  return (
    <div className="relative">
      {categoryStrips.map((category, index) => {
        const isLastCategory = index === categoryCount - 1;
        const animationDelay = `${(index + 1) * 200}ms`;
        const breakAnimationDelay = `${(index + 1) * 200 + 100}ms`;
        
        // Get break component efficiently
        const breakIndex = index % breakComponentCount;
        const BreakComponent = breakComponents[breakIndex].component;
        
        return (
          <div key={category.slug}>
            {/* Category Strip */}
            <div className="animate-fade-in-up" style={{ animationDelay }}>
              <CategoryStrip 
                category={category} 
                posts={category.posts.map((post: any) => ({ ...post, showCategoryBadge: false }))} 
              />
            </div>

            {/* Break Component - only if not last category */}
            {!isLastCategory && (
              <div 
                className="animate-fade-in-up" 
                style={{ animationDelay: breakAnimationDelay }}
              >
                <BreakComponent />
              </div>
            )}
          </div>
        );
      })}

      {/* Newsletter Band - Always at the end with optimized delay */}
      <div 
        className="animate-fade-in-up" 
        style={{ animationDelay: `${(categoryCount + 1) * 200}ms` }}
      >
        <NewsletterBand />
      </div>
    </div>
  );
}

export default async function HomePage() {
  // Fetch categories first
  const categories = await getServerCategories();
  const categorySlugs = categories.map(cat => cat.slug);

  // Fetch data in parallel - now with optimized queries
  const [heroSlides, trending, allCategoryPosts] = await Promise.all([
    getHeroSlides(categorySlugs),
    getTrendingPosts(),
    getAllCategoryPosts(categories),
  ]);

  // Map category posts to their categories, filter out categories without posts
  const categoryStrips = categories
    .map((category, index) => ({
      ...category,
      posts: allCategoryPosts[index] || [],
    }))
    .filter(category => category.posts.length > 0); // Only show categories with content

  const baseUrl = process.env.BASE_URL || 'https://fluxao.de';
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "FluxAO",
    "url": baseUrl,
    "description": "Magazin für KI, Gesellschaft und Zukunft - Entdecke die neuesten Entwicklungen in Technologie und Innovation",
    "inLanguage": "de-DE",
    "publisher": {
      "@type": "Organization",
      "name": "FluxAO",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/og-default.png`
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      
      {/* Hero Slider - Full Width, No Frame, Maximum Impact */}
      <div className="relative">
        {/* Animated background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {heroSlides.length > 0 && <HeroSlider slides={heroSlides} />}
      </div>

      {/* Dynamic Category Layout with Rotating Break Sections */}
      <DynamicCategoryLayout categoryStrips={categoryStrips} />
    </div>
  );
}
