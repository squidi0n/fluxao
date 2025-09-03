import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies } from '@/lib/auth';
import { getForYouPosts } from '@/lib/reco';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    // Get user ID if authenticated
    const user = await getUserFromCookies();
    const userId = user?.id || null;

    const posts = await getForYouPosts(userId, limit);

    // Format response
    const items = posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || post.teaser,
      coverImage: post.coverImage,
      author: {
        name: post.author?.name || 'Anonymous',
        avatar: post.author?.avatar,
      },
      category: post.categories?.[0]?.category || null,
      publishedAt: post.publishedAt,
      viewCount: post.viewCount,
      fluxCount: post.fluxCount,
      trendingScore: post.postScore?.score || 0,
    }));

    return NextResponse.json({
      items,
      isPersonalized: !!userId,
    });
  } catch (error) {
    // console.error('Error getting for-you posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
