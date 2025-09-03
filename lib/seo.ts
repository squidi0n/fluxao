import { Metadata } from 'next';

interface SeoParams {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  tags?: string[];
}

export function generateSeo({
  title,
  description,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  tags,
}: SeoParams): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004';
  const defaultImage = `${baseUrl}/og-default.png`;

  const metadata: Metadata = {
    title: `${title} | FluxAO`,
    description,
    keywords: tags?.join(', '),
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title,
      description,
      type: type as any,
      url: url || baseUrl,
      siteName: 'FluxAO',
      images: [
        {
          url: image || defaultImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'de_DE',
      publishedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image || defaultImage],
    },
    alternates: {
      canonical: url || baseUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  return metadata;
}

export function generateArticleJsonLd({
  title,
  description,
  image,
  url,
  author,
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  image?: string;
  url: string;
  author?: { name: string; url?: string };
  publishedTime?: string;
  modifiedTime?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004';

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || `${baseUrl}/og-default.png`,
    url,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: author
      ? {
          '@type': 'Person',
          name: author.name,
          url: author.url || baseUrl,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'FluxAO',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}
