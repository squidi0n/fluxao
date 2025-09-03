import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import PostCard from './PostCard';

interface CategoryStripProps {
  category: {
    slug: string;
    name: string;
    description: string;
  };
  posts: Array<{
    id: string;
    slug: string;
    title: string;
    subheading?: string | null;
    coverUrl?: string | null;
    excerpt?: string | null;
    publishedAt?: string;
    author: {
      name: string;
      avatarUrl?: string | null;
    };
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
}

export default function CategoryStrip({ category, posts }: CategoryStripProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-12 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
          </div>

          <Link
            href={`/news/${category.slug}`}
            className="group flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Alle ansehen
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(0, 6).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
