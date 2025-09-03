import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const unfollowSchema = z.object({
  targetUserId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies();

    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = unfollowSchema.parse(body);

    // Check if currently following
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    if (!existingFollow) {
      return NextResponse.json({ error: 'Not currently following this user' }, { status: 400 });
    }

    // Remove follow relationship in transaction
    await prisma.$transaction(async (tx) => {
      // Delete follow record
      await tx.follow.delete({
        where: {
          id: existingFollow.id,
        },
      });

      // Update follower count for target user
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          followersCount: { decrement: 1 },
        },
      });

      // Update following count for current user
      await tx.user.update({
        where: { id: user.id },
        data: {
          followingCount: { decrement: 1 },
        },
      });
    });

    logger.info('User unfollowed successfully', {
      followerId: user.id,
      followingId: targetUserId,
    });

    return NextResponse.json({
      success: true,
      isFollowing: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    logger.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
