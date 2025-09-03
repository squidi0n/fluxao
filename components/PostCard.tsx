'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

import { PostCard as PostCardType } from '@/lib/fetchPosts';

interface PostCardProps {
  post: PostCardType;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200">
      <Link
        href={`/${post.slug}`}
        className="block relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700"
      >
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
            {getCategoryLabel(post.category)}
          </span>
        </div>
      </Link>

      <div className="flex-1 flex flex-col p-4">
        <Link href={`/${post.slug}`} className="group">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-2">
            {post.title}
          </h3>
        </Link>

        {post.teaser && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 flex-1">
            {post.teaser}
          </p>
        )}

      </div>
    </article>
  );
}

function getCategoryLabel(slug: string): string {
  const labels: Record<string, string> = {
    'ki-tech': 'KI & Tech',
    'mensch-gesellschaft': 'Mensch',
    'style-aesthetik': 'Style',
    'gaming-kultur': 'Gaming',
    'mindset-philosophie': 'Mindset',
    'fiction-lab': 'Fiction Lab',
  };
  return labels[slug] || slug;
}
