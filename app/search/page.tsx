import { Metadata } from 'next';
import { Suspense } from 'react';

import SearchResults from '@/components/search/SearchResults';

export const metadata: Metadata = {
  title: 'Suche | FluxAO Blog',
  description: 'Durchsuchen Sie unsere Artikel und finden Sie relevante Inhalte.',
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    tags?: string;
    categories?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const tags = params.tags || '';
  const categories = params.categories || '';
  const page = parseInt(params.page || '1', 10);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Suche</h1>

          <Suspense fallback={<SearchSkeleton />}>
            <SearchResults query={query} tags={tags} categories={categories} page={page} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              <div className="flex gap-2 mt-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
