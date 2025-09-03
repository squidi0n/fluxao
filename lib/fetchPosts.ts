// Fetch Posts mit Cursor-Pagination
import { prisma } from '@/lib/prisma';

export type PostCard = {
  id: string;
  slug: string;
  title: string;
  teaser: string | null;
  coverUrl: string | null;
  category: string;
  tags: string[];
  author: { name: string; avatarUrl: string | null } | null;
  publishedAt: string; // ISO
};

export type FetchPostsParams = {
  category: string; // z.B. "ki-tech"
  limit?: number; // default 9
  cursor?: string | null; // base64(id)
};

export async function getPostsByCategory({ category, limit = 9, cursor }: FetchPostsParams) {
  const decodedCursor = cursor ? Buffer.from(cursor, 'base64').toString('utf8') : undefined;

  const rows = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      category,
      publishedAt: { lte: new Date() },
    },
    include: {
      author: { select: { name: true, avatar: true } },
    },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(decodedCursor && { cursor: { id: decodedCursor }, skip: 1 }),
  });

  const hasNext = rows.length > limit;
  const items = hasNext ? rows.slice(0, -1) : rows;

  const data: PostCard[] = items.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    teaser: (r as any).excerpt ?? null,
    coverUrl: (r as any).featuredImage ?? null,
    category: r.category,
    tags: Array.isArray((r as any).tags) ? (r as any).tags : [],
    author: r.author
      ? { name: r.author.name ?? 'Anonym', avatarUrl: (r.author as any).avatar ?? null }
      : null,
    publishedAt: (r.publishedAt as Date).toISOString(),
  }));

  const nextCursor = hasNext
    ? Buffer.from(items[items.length - 1].id, 'utf8').toString('base64')
    : null;

  return { data, pagination: { cursor: nextCursor, has_next: Boolean(nextCursor) } };
}

// Client-side fetch helper
export async function fetchPostsFromAPI({ category, limit = 9, cursor }: FetchPostsParams) {
  const params = new URLSearchParams({
    category,
    limit: limit.toString(),
    ...(cursor && { cursor }),
  });

  const response = await fetch(`/api/posts?${params}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }

  return response.json();
}
