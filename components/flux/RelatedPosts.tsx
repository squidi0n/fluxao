import { Zap, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  author: {
    name: string;
    avatar?: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  viewCount: number;
  fluxCount: number;
}

interface RelatedPostsProps {
  postId: string;
  className?: string;
}

async function getRelatedPosts(postId: string): Promise<RelatedPost[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004'}/api/reco/related?postId=${postId}`,
      {
        cache: 'no-store',
        next: { revalidate: 300 }, // Revalidate every 5 minutes
      },
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    // console.error('Error fetching related posts:', error);
    return [];
  }
}

export default async function RelatedPosts({ postId, className }: RelatedPostsProps) {
  const posts = await getRelatedPosts(postId);

  if (posts.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ähnliche Artikel</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
          >
            <Link href={`/news/${post.slug}`}>
              {/* Image */}
              {post.coverImage ? (
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {post.category && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {post.category.name}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold opacity-20">
                    {post.title.charAt(0)}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h4>

                {post.excerpt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {post.excerpt}
                  </p>
                )}

              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
