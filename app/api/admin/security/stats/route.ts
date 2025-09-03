import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getSecurityStats } from '@/lib/security';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getSecurityStats();

    return NextResponse.json(stats);
  } catch (error) {
    // console.error('Error fetching security stats:', error);
    return NextResponse.json({ error: 'Failed to fetch security stats' }, { status: 500 });
  }
}
