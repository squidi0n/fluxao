import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const followSchema = z.object({
  targetUserId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies();

    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = followSchema.parse(body);

    // Prevent self-following
    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if target user exists and is public
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isPublic: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.isPublic) {
      return NextResponse.json({ error: 'Cannot follow private user' }, { status: 403 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    // Create follow relationship in transaction
    await prisma.$transaction(async (tx) => {
      // Create follow record
      await tx.follow.create({
        data: {
          followerId: user.id,
          followingId: targetUserId,
        },
      });

      // Update follower count for target user
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          followersCount: { increment: 1 },
        },
      });

      // Update following count for current user
      await tx.user.update({
        where: { id: user.id },
        data: {
          followingCount: { increment: 1 },
        },
      });
    });

    logger.info('User followed successfully', {
      followerId: user.id,
      followingId: targetUserId,
    });

    return NextResponse.json({
      success: true,
      isFollowing: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    logger.error('Error following user:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}
