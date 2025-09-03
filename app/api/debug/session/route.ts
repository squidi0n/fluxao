import { NextResponse } from 'next/server';

import { auth } from '@/auth';

export async function GET() {
  const session = await auth();

  return NextResponse.json({
    session,
    isAdmin: session?.user?.email === 'adam.freundt@gmail.com',
    timestamp: new Date().toISOString(),
  });
}
