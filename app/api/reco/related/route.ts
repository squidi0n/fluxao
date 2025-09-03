import { NextRequest, NextResponse } from 'next/server';

import { getRelatedPosts } from '@/lib/reco';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const limit = parseInt(searchParams.get('limit') || '3');

    if (!postId) {
      return NextResponse.json({ error: 'postId parameter required' }, { status: 400 });
    }

    const relatedPosts = await getRelatedPosts(postId, limit);

    // Format response
    const items = relatedPosts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || post.teaser,
      coverImage: post.coverImage,
      author: {
        name: post.author?.name || 'Anonymous',
        avatar: post.author?.avatar,
      },
      category: post.categories[0]?.category || null,
      publishedAt: post.publishedAt,
      viewCount: post.viewCount,
      fluxCount: post.fluxCount,
      score: post.score,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    // console.error('Error getting related posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
