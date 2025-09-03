'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { formatDate } from '@/lib/format';

interface PostCardProps {
  post: {
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
  };
  showCategoryBadge?: boolean;
  className?: string;
}

export default function PostCard({ post, showCategoryBadge = true, className = "" }: PostCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`group h-full ${className}`}
    >
      <Link 
        href={`/news/${post.slug}`} 
        className="block h-full focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-lg"
        aria-label={`Read article: ${post.title}`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-gray-100 hover:border-purple-200 dark:border-gray-700 dark:hover:border-purple-600">
          {/* Cover Image */}
          {post.coverUrl ? (
            <div className="relative aspect-[16/9] bg-gray-200 dark:bg-gray-700">
              <Image
                src={post.coverUrl}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Category Badge */}
            </div>
          ) : (
            <div className="relative aspect-[16/9] bg-gradient-to-br from-blue-500 to-purple-600">
            </div>
          )}

          {/* Content */}
          <div className="p-5 flex-1 flex flex-col">
            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>

            {/* Excerpt */}
            {(post.subheading || post.excerpt) && (
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                {post.subheading || post.excerpt}
              </p>
            )}

          </div>
        </div>
      </Link>
    </motion.article>
  );
}
