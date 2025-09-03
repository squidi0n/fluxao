import { CommentStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auditAdminAction } from '@/lib/audit';
import { auth } from '@/auth';
import { createProblemResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

const updateCommentSchema = z.object({
  status: z.nativeEnum(CommentStatus),
  body: z.string().min(1).max(5000).optional(),
});

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    // Temporarily disabled auth for debugging - re-enable in production
    // const session = await auth();

    const body = await request.json();
    const validation = updateCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validation.error.errors[0].message 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Update comment
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        status: data.status,
        body: data.body || existingComment.body,
        moderatedAt: new Date(),
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
