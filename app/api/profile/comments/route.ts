import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { authorId: session.user.id },
        include: {
          post: { select: { id: true, title: true, slug: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where: { authorId: session.user.id } }),
    ]);

    const data = comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      status: c.status,
      likeCount: c.likeCount,
      dislikeCount: c.dislikeCount,
      replies: c._count.replies,
      article: c.post ? { title: c.post.title, slug: c.post.slug } : null,
    }));

    return NextResponse.json({
      comments: data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

