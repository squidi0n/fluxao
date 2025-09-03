import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { perfCache } from '@/lib/performance-cache';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cache statistics
    const stats = perfCache.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    // console.error('Cache stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch cache stats' }, { status: 500 });
  }
}
