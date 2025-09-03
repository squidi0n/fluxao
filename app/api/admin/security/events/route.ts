import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getSecurityEvents } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');

    const events = await getSecurityEvents(limit);

    return NextResponse.json(events);
  } catch (error) {
    // console.error('Error fetching security events:', error);
    return NextResponse.json({ error: 'Failed to fetch security events' }, { status: 500 });
  }
}
