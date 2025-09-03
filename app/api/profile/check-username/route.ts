import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies();
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 },
      );
    }

    // Check if username follows the pattern
    if (!/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain lowercase letters, numbers, and underscores' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    // Username is available if no user exists or if it's the current user's username
    const available = !existingUser || (user?.id && existingUser.id === user.id);

    return NextResponse.json({ available });
  } catch (error) {
    // console.error('Username check error:', error);
    return NextResponse.json({ error: 'Failed to check username availability' }, { status: 500 });
  }
}
