import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const voteSchema = z.object({
  vote: z.enum(['like', 'dislike']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Anmeldung erforderlich' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = voteSchema.parse(body);

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Artikel nicht gefunden' },
        { status: 404 }
      );
    }

    // Get existing vote if any
    const existingVote = await prisma.articleVote.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: id,
        },
      },
    });

    // If user clicked same vote type, remove it (toggle off)
    if (existingVote && existingVote.type === validatedData.vote) {
      await prisma.articleVote.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: id,
          },
        },
      });
    } else {
      // Create or update vote
      await prisma.articleVote.upsert({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: id,
          },
        },
        update: {
          type: validatedData.vote,
        },
        create: {
          userId: session.user.id,
          postId: id,
          type: validatedData.vote,
        },
      });
    }

    // Get updated vote counts
    const [likes, dislikes] = await Promise.all([
      prisma.articleVote.count({
        where: {
          postId: id,
          type: 'like',
        },
      }),
      prisma.articleVote.count({
        where: {
          postId: id,
          type: 'dislike',
        },
      }),
    ]);

    // Get user's current vote
    const userVote = await prisma.articleVote.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      likes,
      dislikes,
      userVote: userVote?.type || null,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Bewertung', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting vote:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Bewertung' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    // Get vote counts
    const [likes, dislikes] = await Promise.all([
      prisma.articleVote.count({
        where: {
          postId: id,
          type: 'like',
        },
      }),
      prisma.articleVote.count({
        where: {
          postId: id,
          type: 'dislike',
        },
      }),
    ]);

    let userVote = null;
    if (session?.user?.id) {
      const vote = await prisma.articleVote.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: id,
          },
        },
      });
      userVote = vote?.type || null;
    }

    return NextResponse.json({
      likes,
      dislikes,
      userVote,
    });

  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Bewertungen' },
      { status: 500 }
    );
  }
}