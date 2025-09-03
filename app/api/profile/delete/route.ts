import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromCookies();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user and all related data (cascade delete)
    await prisma.$transaction(async (tx) => {
      // Delete social links
      await tx.socialLink.deleteMany({
        where: { userId: user.id },
      });

      // Delete posts if they exist
      await tx.post
        .deleteMany({
          where: { authorId: user.id },
        })
        .catch(() => {
          // Table might not exist yet
        });

      // Delete comments if they exist
      await tx.comment
        .deleteMany({
          where: { authorId: user.id },
        })
        .catch(() => {
          // Table might not exist yet
        });

      // Delete user
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    return NextResponse.json({ message: 'Account deleted successfully' }, { status: 200 });
  } catch (error) {
    // console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
