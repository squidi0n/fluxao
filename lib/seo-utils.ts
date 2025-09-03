/**
 * Enhanced SEO Utilities for FluxAO
 * Optimized for German AI/Tech Keywords and Rankings
 */

export interface SEOKeywords {
  primary: string;
  secondary: string[];
  longTail: string[];
}

export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  image: string[];
  datePublished: string;
  dateModified: string;
  author: {
    "@type": "Person";
    name: string;
    url?: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  articleSection: string;
  wordCount: number;
  inLanguage: "de-DE";
  keywords: string[];
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPoint: {
    "@type": "ContactPoint";
    contactType: "customer service";
    availableLanguage: "German";
  };
}

export interface FAQSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

// German AI/Tech Keyword Categories
export const GERMAN_AI_KEYWORDS = {
  primary: [
    "Künstliche Intelligenz",
    "KI Deutschland",
    "AI Technology",
    "Machine Learning",
    "Tech News Deutschland",
    "Innovation Magazin"
  ],
  aiTools: [
    "ChatGPT deutsch",
    "AI Tools 2025",
    "KI Software",
    "Machine Learning Tools",
    "AI Automation",
    "Prompt Engineering"
  ],
  society: [
    "KI Ethik",
    "AI Impact Society",
    "Digitalisierung Deutschland",
    "Zukunft der Arbeit",
    "AI Regulation",
    "Tech Policy"
  ],
  trends: [
    "Tech Trends 2025",
    "AI Entwicklungen",
    "Robotik News",
    "Quantum Computing",
    "VR AR Technologie",
    "IoT Deutschland"
  ]
};

/**
 * Generate optimized meta title for German market
 */
export function generateGermanMetaTitle(
  title: string,
  category: string,
  keywords?: string[]
): string {
  const maxLength = 55;
  let metaTitle = title;

  // Add category context for better rankings
  if (category === 'ki-tech') {
    metaTitle = `${title} | KI & Tech News`;
  } else if (category === 'mensch-gesellschaft') {
    metaTitle = `${title} | Digital Society`;
  } else {
    metaTitle = `${title} | FluxAO`;
  }

  // Truncate if too long
  if (metaTitle.length > maxLength) {
    metaTitle = metaTitle.substring(0, maxLength - 3) + '...';
  }

  return metaTitle;
}

/**
 * Generate SEO-optimized meta description
 */
export function generateMetaDescription(
  content: string,
  keywords: string[],
  maxLength: number = 155
): string {
  // Extract first meaningful paragraph
  let description = content
    .replace(/<[^>]*>/g, '') // Remove HTML
    .replace(/\n\s*\n/g, ' ') // Replace line breaks
    .trim()
    .substring(0, maxLength * 2);

  // Find natural sentence break
  const lastSentence = description.lastIndexOf('.');
  if (lastSentence > 100) {
    description = description.substring(0, lastSentence + 1);
  }

  // Ensure primary keyword is included
  if (keywords.length > 0 && !description.toLowerCase().includes(keywords[0].toLowerCase())) {
    description = `${keywords[0]}: ${description}`;
  }

  // Truncate to max length
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }

  return description;
}

/**
 * Generate Article Schema.org markup
 */
export function generateArticleSchema(
  article: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    publishedAt: Date;
    updatedAt?: Date;
    author: { name: string; avatar?: string };
    category: string;
    slug: string;
  },
  baseUrl: string,
  keywords: string[]
): ArticleSchema {
  const wordCount = article.content.replace(/<[^>]*>/g, '').split(' ').length;
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || generateMetaDescription(article.content, keywords),
    image: article.coverImage ? [article.coverImage] : [`${baseUrl}/og-default.png`],
    datePublished: article.publishedAt.toISOString(),
    dateModified: (article.updatedAt || article.publishedAt).toISOString(),
    author: {
      "@type": "Person",
      name: article.author.name,
      url: article.author.avatar ? `${baseUrl}/profile/${article.author.name.toLowerCase().replace(' ', '-')}` : undefined
    },
    publisher: {
      "@type": "Organization",
      name: "FluxAO",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/${article.slug}`
    },
    articleSection: article.category,
    wordCount: wordCount,
    inLanguage: "de-DE",
    keywords: keywords
  };
}

/**
 * Generate Breadcrumb Schema
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>,
  baseUrl: string
): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: breadcrumb.name,
      item: `${baseUrl}${breadcrumb.url}`
    }))
  };
}

/**
 * Generate FAQ Schema for articles
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): FAQSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

/**
 * Extract keywords from content
 */
export function extractKeywords(content: string, category: string): SEOKeywords {
  const text = content.toLowerCase().replace(/<[^>]*>/g, '');
  
  // Category-specific keywords
  let categoryKeywords: string[] = [];
  
  switch (category) {
    case 'ki-tech':
      categoryKeywords = GERMAN_AI_KEYWORDS.primary.concat(GERMAN_AI_KEYWORDS.aiTools);
      break;
    case 'mensch-gesellschaft':
      categoryKeywords = GERMAN_AI_KEYWORDS.society;
      break;
    default:
      categoryKeywords = GERMAN_AI_KEYWORDS.trends;
  }
  
  // Find matching keywords in content
  const foundKeywords = categoryKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  return {
    primary: foundKeywords[0] || categoryKeywords[0],
    secondary: foundKeywords.slice(1, 4),
    longTail: foundKeywords.slice(4, 8)
  };
}

/**
 * Calculate content SEO score
 */
export function calculateSEOScore(
  content: string,
  title: string,
  description: string,
  keywords: string[]
): number {
  let score = 0;
  const text = content.toLowerCase();
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  
  // Title optimization (20 points)
  if (titleLower.length >= 30 && titleLower.length <= 60) score += 10;
  if (keywords.some(k => titleLower.includes(k.toLowerCase()))) score += 10;
  
  // Meta description (15 points)
  if (descLower.length >= 120 && descLower.length <= 155) score += 8;
  if (keywords.some(k => descLower.includes(k.toLowerCase()))) score += 7;
  
  // Content optimization (35 points)
  const wordCount = text.split(' ').length;
  if (wordCount >= 300) score += 10;
  if (wordCount >= 1000) score += 5;
  
  // Keyword density check (1-2% optimal)
  keywords.forEach(keyword => {
    const keywordCount = (text.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    const density = (keywordCount / wordCount) * 100;
    if (density >= 0.5 && density <= 2.5) score += 5;
  });
  
  // Structure (30 points)
  if (content.includes('<h2>') || content.includes('<h3>')) score += 10;
  if (content.includes('<img')) score += 5;
  if (content.includes('alt="')) score += 10;
  if (content.includes('<a href')) score += 5;
  
  return Math.min(score, 100);
}

/**
 * Generate sitemap entry for article
 */
export function generateSitemapEntry(
  article: {
    slug: string;
    updatedAt: Date;
    publishedAt: Date;
    viewCount?: number;
  },
  baseUrl: string
) {
  // Priority based on recency and popularity
  let priority = 0.7;
  
  const daysSincePublished = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished <= 7) priority = 0.9;
  else if (daysSincePublished <= 30) priority = 0.8;
  
  if (article.viewCount && article.viewCount > 1000) priority += 0.1;
  
  return {
    url: `${baseUrl}/${article.slug}`,
    lastmod: article.updatedAt.toISOString(),
    changefreq: daysSincePublished <= 7 ? 'daily' : 'weekly',
    priority: Math.min(priority, 1.0)
  };
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /profile/
Disallow: /_next/
Disallow: /fonts/

# AI Crawlers
User-agent: GPTBot
Allow: /
Disallow: /admin/

User-agent: ChatGPT-User
Allow: /
Disallow: /admin/

User-agent: CCBot
Allow: /
Disallow: /admin/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-articles.xml

# Crawl-delay for better server performance
Crawl-delay: 1`;
}