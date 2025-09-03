'use client';

import { BreadcrumbSchema } from '@/lib/seo-utils';

interface BreadcrumbJsonLdProps {
  breadcrumbs: BreadcrumbSchema;
}

export default function BreadcrumbJsonLd({ breadcrumbs }: BreadcrumbJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbs, null, 0),
      }}
    />
  );
}