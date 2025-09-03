'use client';

import { useState } from 'react';
import PostCard from '@/components/PostCard';
import { PostCard as PostCardType } from '@/lib/fetchPosts';

interface LoadMoreButtonProps {
  initialCursor: string | null;
  category: string;
}

export default function LoadMoreButton({ initialCursor, category }: LoadMoreButtonProps) {
  const [posts, setPosts] = useState<PostCardType[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (!cursor || loading) return;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        category,
        limit: '9',
        cursor,
      });

      const response = await fetch(`/api/news/posts?${params}`);
      const data = await response.json();

      setPosts((prev) => [...prev, ...data.data]);
      setCursor(data.pagination.cursor);
      setHasMore(data.pagination.has_next);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {hasMore && cursor && (
        <div className="flex justify-center mb-12">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Lade weitere Artikel...
              </span>
            ) : (
              'Mehr laden'
            )}
          </button>
        </div>
      )}
    </>
  );
}
