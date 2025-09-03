import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reactionSchema = z.object({
  type: z.enum(['like', 'dislike']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const { type } = reactionSchema.parse(body);
    
    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { 
        id: true, 
        likeCount: true, 
        dislikeCount: true,
        status: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Kommentar nicht gefunden' },
        { status: 404 }
      );
    }

    if (comment.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Kommentar noch nicht freigegeben' },
        { status: 403 }
      );
    }

    // For simplicity, we'll just increment the counter
    // In a real app, you'd track user reactions to prevent multiple votes
    const updateData = type === 'like' 
      ? { likeCount: { increment: 1 } }
      : { dislikeCount: { increment: 1 } };

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        likeCount: true,
        dislikeCount: true,
      },
    });

    return NextResponse.json({
      id: updatedComment.id,
      likeCount: updatedComment.likeCount,
      dislikeCount: updatedComment.dislikeCount,
      type,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingaben', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error reacting to comment:', error);
    return NextResponse.json(
      { error: 'Fehler beim Bewerten des Kommentars' },
      { status: 500 }
    );
  }
}