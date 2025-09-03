'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

import { PostCard } from '@/lib/fetchPosts';

interface FeaturedPostProps {
  post: PostCard;
}

export default function FeaturedPost({ post }: FeaturedPostProps) {
  return (
    <article className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
      <Link href={`/news/${post.slug}`} className="block">
        <div className="md:flex">
          <div className="md:w-3/5 relative aspect-[16/10] md:aspect-video">
            {post.coverUrl ? (
              <Image
                src={post.coverUrl}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-white/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white">
                Featured
              </span>
            </div>
          </div>

          <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-center">
            <div className="mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {getCategoryLabel(post.category)}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {post.title}
            </h2>

            {post.teaser && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{post.teaser}</p>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              {post.author && (
                <div className="flex items-center space-x-2">
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
                </div>
              )}
              <time dateTime={post.publishedAt}>
                {format(new Date(post.publishedAt), 'd. MMMM yyyy', { locale: de })}
              </time>
            </div>

            <div className="mt-4">
              <span className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                Weiterlesen
                <svg
                  className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function getCategoryLabel(slug: string): string {
  const labels: Record<string, string> = {
    'ki-tech': 'KI & Tech',
    'mensch-gesellschaft': 'Mensch & Gesellschaft',
    'style-aesthetik': 'Style & Ästhetik',
    'gaming-kultur': 'Gaming & Kultur',
    'mindset-philosophie': 'Mindset & Philosophie',
    'fiction-lab': 'Fiction Lab',
  };
  return labels[slug] || slug;
}
