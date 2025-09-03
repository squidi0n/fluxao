import { prisma } from '@/lib/prisma';

/**
 * Calculate Jaccard similarity between two sets of tags
 */
export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate content similarity between two posts
 */
export function calculateContentSimilarity(
  post1: { tags: string[]; categoryId?: string },
  post2: { tags: string[]; categoryId?: string },
): number {
  // Tag similarity (70% weight)
  const tagSim = jaccardSimilarity(new Set(post1.tags), new Set(post2.tags));

  // Category similarity (30% weight)
  const catSim = post1.categoryId === post2.categoryId ? 1 : 0;

  return 0.7 * tagSim + 0.3 * catSim;
}

/**
 * Normalize score to 0-1 range using log1p
 */
export function normalizeScore(value: number): number {
  return Math.log1p(value) / Math.log1p(10000); // Assuming 10000 as max reasonable value
}

/**
 * Calculate trending score for a post
 */
export function calculateTrendingScore(
  views: number,
  minutes: number,
  fluxCount: number,
  ageInDays: number,
): number {
  // Weights: views (50%), reading time (30%), flux (20%)
  const rawScore =
    0.5 * normalizeScore(views) + 0.3 * normalizeScore(minutes) + 0.2 * normalizeScore(fluxCount);

  // Apply time decay (halves every 7 days)
  const decay = Math.pow(0.5, ageInDays / 7);

  return rawScore * decay;
}

/**
 * Get related posts based on content similarity
 */
export async function getRelatedPosts(postId: string, limit = 3): Promise<any[]> {
  // Get the target post with tags and category
  const targetPost = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      tags: {
        include: { tag: true },
      },
      categories: {
        include: { category: true },
        take: 1,
      },
    },
  });

  if (!targetPost) return [];

  const targetTags = targetPost.tags.map((pt) => pt.tag.slug);
  const targetCategoryId = targetPost.categories[0]?.category.id;

  // Get candidate posts (same category or shared tags)
  const candidates = await prisma.post.findMany({
    where: {
      id: { not: postId },
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      OR: [
        // Same category
        targetCategoryId
          ? {
              categories: {
                some: { categoryId: targetCategoryId },
              },
            }
          : {},
        // Shared tags
        targetTags.length > 0
          ? {
              tags: {
                some: {
                  tag: {
                    slug: { in: targetTags },
                  },
                },
              },
            }
          : {},
      ].filter((clause) => Object.keys(clause).length > 0),
    },
    include: {
      tags: {
        include: { tag: true },
      },
      categories: {
        include: { category: true },
        take: 1,
      },
      author: {
        select: {
          name: true,
          avatar: true,
        },
      },
      postScore: true,
    },
    take: 20, // Get more candidates for better selection
  });

  // Calculate similarity scores
  const scoredPosts = candidates.map((post) => {
    const postTags = post.tags.map((pt) => pt.tag.slug);
    const postCategoryId = post.categories[0]?.category.id;

    const contentSim = calculateContentSimilarity(
      { tags: targetTags, categoryId: targetCategoryId },
      { tags: postTags, categoryId: postCategoryId },
    );

    // Get trending score from PostScore or calculate fresh
    const trendingScore = post.postScore?.score || 0;

    // Combined score: 60% content similarity, 40% trending
    const combinedScore = 0.6 * contentSim + 0.4 * trendingScore;

    return {
      ...post,
      score: combinedScore,
    };
  });

  // Sort by score and return top N
  return scoredPosts.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Get personalized recommendations for a user
 */
export async function getForYouPosts(userId: string | null, limit = 6): Promise<any[]> {
  if (!userId) {
    // For guests, return trending posts
    return getTrendingPosts(limit);
  }

  // Get user's reading history (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const readingHistory = await prisma.readingHistory.findMany({
    where: {
      userId,
      lastAt: { gte: thirtyDaysAgo },
    },
    include: {
      post: {
        include: {
          tags: {
            include: { tag: true },
          },
          categories: {
            include: { category: true },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      lastAt: 'desc',
    },
    take: 50,
  });

  // Build user profile from reading history
  const tagFrequency = new Map<string, number>();
  const categoryFrequency = new Map<string, number>();
  const readPostIds = new Set(readingHistory.map((rh) => rh.postId));

  readingHistory.forEach((rh) => {
    // Count tags
    rh.post.tags.forEach((pt) => {
      const count = tagFrequency.get(pt.tag.slug) || 0;
      tagFrequency.set(pt.tag.slug, count + 1);
    });

    // Count categories
    const category = rh.post.categories[0]?.category;
    if (category) {
      const count = categoryFrequency.get(category.id) || 0;
      categoryFrequency.set(category.id, count + 1);
    }
  });

  // Get top tags and categories
  const topTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const topCategories = Array.from(categoryFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([catId]) => catId);

  // Get recommended posts
  const recommendations = await prisma.post.findMany({
    where: {
      id: { notIn: Array.from(readPostIds) },
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      OR: [
        // Posts with user's favorite tags
        topTags.length > 0
          ? {
              tags: {
                some: {
                  tag: {
                    slug: { in: topTags },
                  },
                },
              },
            }
          : {},
        // Posts in user's favorite categories
        topCategories.length > 0
          ? {
              categories: {
                some: {
                  categoryId: { in: topCategories },
                },
              },
            }
          : {},
      ].filter((clause) => Object.keys(clause).length > 0),
    },
    include: {
      author: {
        select: {
          name: true,
          avatar: true,
        },
      },
      categories: {
        include: { category: true },
        take: 1,
      },
      postScore: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit * 2,
  });

  // If not enough recommendations, add trending posts
  if (recommendations.length < limit) {
    const trending = await getTrendingPosts(limit - recommendations.length, readPostIds);
    recommendations.push(...trending);
  }

  // Sort by score and return
  return recommendations
    .sort((a, b) => (b.postScore?.score || 0) - (a.postScore?.score || 0))
    .slice(0, limit);
}

/**
 * Get trending posts
 */
export async function getTrendingPosts(
  limit = 6,
  excludeIds: Set<string> = new Set(),
): Promise<any[]> {
  const posts = await prisma.post.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
    },
    include: {
      author: {
        select: {
          name: true,
          avatar: true,
        },
      },
      categories: {
        include: { category: true },
        take: 1,
      },
      postScore: true,
    },
    orderBy: [{ postScore: { score: 'desc' } }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
  });

  return posts;
}
