import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { moderateComment } from '@/lib/ai-moderation';

const commentSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(50, 'Name zu lang'),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  content: z.string().min(1, 'Kommentar ist erforderlich').max(1000, 'Kommentar zu lang'),
  parentId: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.comment.count({
      where: {
        postId: id,
        parentId: null,
        status: 'APPROVED',
      },
    });
    
    const comments = await prisma.comment.findMany({
      where: {
        postId: id,
        parentId: null, // Only top-level comments
        status: 'APPROVED',
      },
      include: {
        replies: {
          where: {
            status: 'APPROVED',
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Transform for frontend
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      body: comment.body,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      createdAt: comment.createdAt.toISOString(),
      status: comment.status,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      replies: comment.replies?.map(reply => ({
        id: reply.id,
        body: reply.body,
        authorName: reply.authorName,
        authorEmail: reply.authorEmail,
        createdAt: reply.createdAt.toISOString(),
        status: reply.status,
        likeCount: reply.likeCount,
        dislikeCount: reply.dislikeCount,
      })) || [],
    }));

    return NextResponse.json({
      comments: transformedComments,
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Kommentare' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = commentSchema.parse(body);
    
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

    // Check if parent comment exists (for replies)
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment || parentComment.postId !== id) {
        return NextResponse.json(
          { error: 'Eltern-Kommentar nicht gefunden' },
          { status: 404 }
        );
      }
    }

    // AI Moderation
    const moderationResult = await moderateComment(
      validatedData.content,
      validatedData.name,
      validatedData.email || undefined
    );

    // Check user role and trust level for Premium Auto-Approval
    let userRole = null;
    let trustLevel = 0;
    let userId = null;
    if (validatedData.email) {
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
        select: { role: true, id: true },
      });
      userRole = user?.role;
      // trustLevel = user?.trustLevel || 0; // TODO: Add after migration
      userId = user?.id;
    }

    // Determine comment status based on AI moderation + Premium status
    let commentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
    switch (moderationResult.status) {
      case 'approved':
        commentStatus = 'APPROVED'; // Auto-approve clean comments
        break;
      case 'rejected':
        return NextResponse.json(
          { 
            error: 'Ihr Kommentar wurde automatisch abgelehnt.',
            reason: moderationResult.reason,
            details: 'Bitte überprüfen Sie Ihren Kommentar auf unangemessene Inhalte.'
          },
          { status: 400 }
        );
      case 'spam':
        return NextResponse.json(
          { 
            error: 'Ihr Kommentar wurde als Spam erkannt.',
            reason: 'Bitte vermeiden Sie Werbung und verdächtige Links.'
          },
          { status: 400 }
        );
      default: // 'review'
        // Premium Auto-Approval Logic
        if (userRole === 'ADMIN') {
          commentStatus = 'APPROVED'; // Admins always approved
        } else if (userRole === 'PREMIUM') {
          commentStatus = 'APPROVED'; // Premium users auto-approved
        // } else if (trustLevel >= 80) {
        //   commentStatus = 'APPROVED'; // High-trust users auto-approved (TODO: nach Migration)
        } else {
          commentStatus = 'PENDING'; // Regular users need moderation
        }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        body: validatedData.content,
        authorName: validatedData.name,
        authorEmail: validatedData.email || null,
        authorId: userId,
        postId: id,
        parentId: validatedData.parentId || null,
        status: commentStatus,
        likeCount: 0,
        dislikeCount: 0,
        // AI Moderation data
        moderationStatus: moderationResult.status,
        moderationReason: moderationResult.reason,
        moderationScore: moderationResult.score,
        aiReviewed: true,
        aiReviewedAt: new Date(),
      },
    });

    // TODO: Trust level updates nach DB-Migration
    // if (commentStatus === 'APPROVED' && userId) { ... }

    return NextResponse.json({
      id: comment.id,
      body: comment.body,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      createdAt: comment.createdAt.toISOString(),
      status: comment.status,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingaben', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Kommentars' },
      { status: 500 }
    );
  }
}