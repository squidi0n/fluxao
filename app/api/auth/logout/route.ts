import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();

  // Delete auth token
  cookieStore.delete('auth-token');

  // Delete all other possible auth cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.includes('auth') || cookie.name.includes('session')) {
      cookieStore.delete(cookie.name);
    }
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  // Also support GET for easy logout via link
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');

  return NextResponse.redirect(new URL('/', req.url));
}
