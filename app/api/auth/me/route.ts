import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  return NextResponse.json({ user });
}
