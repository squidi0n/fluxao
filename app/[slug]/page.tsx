export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/format';
import { auth } from '@/auth';
import { sanitizeHtml } from '@/lib/sanitize';
import CommentSection from '@/components/article/CommentSection';
import FluxRating from '@/components/article/FluxRating';
import VoteBox from '@/components/article/VoteBox';
import {
  Share2,
  Bookmark,
  Twitter,
  Linkedin,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Eye,
  Copy,
  Facebook,
  Heart,
  Star,
} from 'lucide-react';
import NewsletterSignup from '@/components/NewsletterSignup';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string, isAdmin: boolean = false) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    if (post.status !== 'PUBLISHED' && !isAdmin) {
      return null;
    }

    if (post.status === 'PUBLISHED') {
      await prisma.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return post;
  } catch (error) {
    return null;
  }
}

async function getRelatedPosts(currentPostId: string, categoryIds: string[]) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        id: { not: currentPostId },
        status: 'PUBLISHED',
        categories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
      },
      include: {
        author: true,
        categories: {
          include: { category: true },
        },
      },
      take: 3,
      orderBy: { viewCount: 'desc' },
    });

    return posts;
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';
  const post = await getPost(slug, isAdmin);

  if (!post) {
    return {
      title: 'Artikel nicht gefunden | FluxAO',
    };
  }

  return {
    title: post.title,
    description: post.teaser || post.excerpt || post.title,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';
  const post = await getPost(slug, isAdmin);

  if (!post) {
    notFound();
  }

  const categoryIds = post.categories.map((c) => c.categoryId);
  const relatedPosts = await getRelatedPosts(post.id, categoryIds);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  const shareUrl = `${baseUrl}/news/${post.slug}`;

  const [likes, dislikes, existingUserVote] = await Promise.all([
    prisma.articleVote.count({ where: { postId: post.id, type: 'like' } }),
    prisma.articleVote.count({ where: { postId: post.id, type: 'dislike' } }),
    session?.user?.id
      ? prisma.articleVote.findUnique({
          where: { userId_postId: { userId: session.user.id, postId: post.id } },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <article className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Article Content - 3/4 width */}
            <div className="lg:col-span-3" id="main-content">
              {/* Categories */}
              {post.categories.length > 0 && (
                <div className="mb-4">
                  {post.categories.map(({ category }) => (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      className="inline-block px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 mr-2"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Teaser */}
              {post.teaser && (
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">{post.teaser}</p>
              )}

              {/* Cover Image */}
              {post.coverImage && (
                <div className="relative w-full h-[400px] mb-8 rounded-lg overflow-hidden" id="cover-image">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Author & Meta Information */}
              <div className="flex flex-wrap items-center justify-center py-4 border-t border-b border-gray-200 mb-8">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>von {post.author?.name || 'FluxAO Team'}</span>
                  <time dateTime={post.publishedAt?.toISOString()}>
                    {post.publishedAt?.toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span>{post.viewCount} Aufrufe</span>
                </div>
              </div>

              {/* Article Content */}
              <div className="prose prose-lg max-w-none mb-12 prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:mb-4 prose-p:leading-relaxed prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-purple-50 prose-code:px-1 prose-code:rounded">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || post.body || '') }} />
              </div>

              {/* Rating Box */}
              <div className="mb-12">
                <FluxRating
                  articleId={post.id}
                  articleSlug={post.slug}
                  initialLikes={likes}
                  initialDislikes={dislikes}
                  currentUserVote={existingUserVote?.type || null}
                />
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(({ tag }) => (
                      <Link
                        key={tag.slug}
                        href={`/?tag=${tag.slug}`}
                        className="inline-block px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="mb-12">
                  <div className="border-t border-gray-200 my-12"></div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Das könnte dich auch interessieren
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {relatedPosts.map((relatedPost) => (
                      <Link
                        key={relatedPost.slug}
                        href={`/${relatedPost.slug}`}
                        className="block group"
                      >
                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-4">
                          {relatedPost.coverImage && (
                            <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                              <Image
                                src={relatedPost.coverImage}
                                alt={relatedPost.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          )}
                          {relatedPost.categories[0] && (
                            <span className="inline-block px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded mb-2">
                              {relatedPost.categories[0].category.name}
                            </span>
                          )}
                          <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                            {relatedPost.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {relatedPost.excerpt || relatedPost.teaser}
                          </p>
                          <div className="mt-3 text-xs text-gray-500">
                            {relatedPost.viewCount} Aufrufe
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Diskussion Bereich */}
              <div className="relative mb-6">
                <div className="relative p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="h-px bg-gray-300 flex-1 max-w-16"></div>
                    <div className="mx-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </div>
                    <div className="h-px bg-gray-300 flex-1 max-w-16"></div>
                  </div>
                  <h3 className="text-md font-medium text-gray-700">
                    💬 Lass uns diskutieren
                  </h3>
                </div>
              </div>

              {/* Comment Section */}
              <CommentSection articleId={post.id} articleSlug={post.slug} />

              {/* Newsletter CTA unten */}
              <div className="mt-12 p-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-center">
                <h3 className="text-xl font-bold mb-2">📬 Newsletter abonnieren</h3>
                <p className="text-sm mb-4 text-purple-100">Verpasse keine neuen Tech-News!</p>
                <div className="max-w-md mx-auto">
                  <NewsletterSignup variant="light" />
                </div>
              </div>
            </div>

            {/* Right Sidebar - 1/4 width */}
            <aside className="lg:col-span-1">
              {/* Fixed height to match cover image exactly */}
              <div className="sticky top-32 h-[400px] space-y-4">
                {/* Share Box */}
                <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 text-center">Artikel teilen</h3>
                  <div className="space-y-2">
                    <Link href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareUrl)}`} className="w-full flex items-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                      <Copy className="w-4 h-4" />
                      <span className="text-xs font-medium">Link kopieren</span>
                    </Link>
                    
                    <Link href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                      <Facebook className="w-4 h-4" />
                      <span className="text-xs font-medium">Facebook</span>
                    </Link>
                    
                    <Link href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors">
                      <Linkedin className="w-4 h-4" />
                      <span className="text-xs font-medium">LinkedIn</span>
                    </Link>
                    
                    <div className="w-full flex items-center gap-2 p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg transition-colors cursor-pointer">
                      <Star className="w-4 h-4" />
                      <span className="text-xs font-medium">Als Favorit speichern</span>
                    </div>
                  </div>
                </div>

                {/* Newsletter */}
                <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                  <h3 className="text-base font-bold mb-2 text-gray-900">📬 Newsletter</h3>
                  <p className="text-xs mb-3 text-gray-600">Erhalte die neuesten Tech-News</p>
                  <NewsletterSignup variant="compact" />
                </div>

              </div>
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}