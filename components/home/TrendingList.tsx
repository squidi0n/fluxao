import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { formatDateShort } from '@/lib/format';

interface TrendingPost {
  id: string;
  slug: string;
  title: string;
  publishedAt?: string;
  category?: {
    name: string;
    slug: string;
  } | null;
}

interface TrendingListProps {
  posts: TrendingPost[];
}

export default function TrendingList({ posts }: TrendingListProps) {
  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Trending Now</h2>
      </div>

      <div className="space-y-4">
        {posts.length > 0
          ? posts.map((post, index) => (
              <article key={post.id} className="group">
                <Link 
                  href={`/news/${post.slug}`} 
                  className="block focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-lg p-2 -m-2"
                  aria-label={`Read trending article: ${post.title}`}
                >
                  <div className="flex gap-3">
                    {/* Number */}
                    <span className="text-2xl font-bold text-gray-300 dark:text-gray-600 w-8">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {post.category && (
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                          {post.category.name}
                        </span>
                      )}

                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mt-1">
                        {post.title}
                      </h3>

                      {post.publishedAt && (
                        <time
                          dateTime={post.publishedAt}
                          className="text-xs text-gray-600 dark:text-gray-400 mt-1"
                        >
                          {formatDateShort(post.publishedAt)}
                        </time>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            ))
          : // Skeleton loading
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <span className="text-2xl font-bold text-gray-200 dark:text-gray-700 w-8">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            ))}
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/trending"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded px-2 py-1 min-h-[44px] flex items-center"
        >
          Alle Trending Posts →
        </Link>
      </div>
    </div>
  );
}
