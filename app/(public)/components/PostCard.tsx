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
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group h-full"
    >
      <Link href={`/news/${post.slug}`} className="block h-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
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
              {post.category && (
                <div className="absolute top-3 left-3">
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded">
                    {post.category.name}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative aspect-[16/9] bg-gradient-to-br from-blue-500 to-purple-600">
              {post.category && (
                <div className="absolute top-3 left-3">
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-black/30 backdrop-blur rounded">
                    {post.category.name}
                  </span>
                </div>
              )}
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

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-auto">
              {post.author.avatarUrl ? (
                <Image
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}

              <span className="font-medium">{post.author.name}</span>

              {post.publishedAt && (
                <>
                  <span className="text-gray-400">•</span>
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
