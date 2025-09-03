'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/format';

interface Post {
  id: string;
  slug: string;
  title: string;
  teaser: string | null;
  coverImage: string | null;
  excerpt: string | null;
  publishedAt: Date | null;
  author: {
    name: string | null;
    avatar: string | null;
  } | null;
  viewCount: number;
}

const categoryInfo: Record<string, { title: string; description: string }> = {
  'ki-tech': {
    title: 'KI & Tech',
    description: 'Neues aus KI, Tools, Agents & Infrastruktur',
  },
  'mensch-gesellschaft': {
    title: 'Mensch & Gesellschaft',
    description: 'Gesellschaftstrends und soziale Innovation',
  },
  'style-aesthetik': {
    title: 'Style & Ästhetik',
    description: 'Design-Innovationen und visuelle Kultur',
  },
  'gaming-kultur': {
    title: 'Gaming & Kultur',
    description: 'Gaming-Kultur und digitale Unterhaltung',
  },
  'mindset-philosophie': {
    title: 'Mindset & Philosophie',
    description: 'Digitales Denken und Tech-Philosophie',
  },
  'fiction-lab': {
    title: 'Fiction Lab',
    description: 'Experimentelle Stories & kreative Narrative',
  },
};

export default function NewsCategoryPage({ category }: { category: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const info = categoryInfo[category] || { title: 'News', description: '' };

  useEffect(() => {
    fetchPosts();
  }, [category, page]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/posts?category=${category}&page=${page}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        if (page === 1) {
          setPosts(data.posts || []);
        } else {
          setPosts((prev) => [...prev, ...(data.posts || [])]);
        }
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-xl h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{info.title}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">{info.description}</p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Link href={`/news/${post.slug}`}>
                    {post.coverImage ? (
                      <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <span className="text-white text-6xl font-bold opacity-20">
                          {info.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="p-6">
                    <Link href={`/news/${post.slug}`}>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {post.title}
                      </h2>
                    </Link>

                    {post.teaser && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {post.teaser}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                      <div className="flex items-center gap-2">
                        {post.author?.avatar ? (
                          <Image
                            src={post.author.avatar}
                            alt={post.author.name || ''}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        )}
                        <span>{post.author?.name || 'Anonym'}</span>
                      </div>

                      {post.publishedAt && (
                        <time dateTime={post.publishedAt.toString()}>
                          {formatDate(post.publishedAt.toString())}
                        </time>
                      )}
                    </div>

                    {post.viewCount > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        {post.viewCount.toLocaleString()} Aufrufe
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loading}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Lädt...' : 'Mehr laden'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">
              Noch keine Artikel in dieser Kategorie.
            </p>
            <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
              Zur Startseite →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
