'use client';

import { ArticleSchema } from '@/lib/seo-utils';

interface ArticleJsonLdProps {
  article: ArticleSchema;
}

export default function ArticleJsonLd({ article }: ArticleJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(article, null, 0),
      }}
    />
  );
}