'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { formatDate } from '@/lib/format';

interface HeroFeaturedProps {
  post: {
    id: string;
    slug: string;
    title: string;
    subheading?: string | null;
    coverUrl: string;
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

export default function HeroFeatured({ post }: HeroFeaturedProps) {
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="group relative h-full"
    >
      <Link href={`/news/${post.slug}`}>
        <div className="relative aspect-[16/9] lg:aspect-[2/1] rounded-xl overflow-hidden bg-gray-900">
          <Image
            src={post.coverUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70" />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
            {/* Category Badge */}
            {post.category && (
              <div className="mb-3">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {post.category.name}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2 line-clamp-2">
              {post.title}
            </h1>

            {/* Subheading */}
            {post.subheading && (
              <p className="text-gray-200 text-lg lg:text-xl mb-4 line-clamp-2">
                {post.subheading}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-gray-300 text-sm">
              {post.author.avatarUrl && (
                <Image
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
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
