import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // console.log('=== ALL COOKIES IN REQUEST ===');
  // console.log(allCookies);
  // console.log('==============================');

  // Also check headers
  const headers = request.headers;
  // console.log('=== AUTHORIZATION HEADER ===');
  // console.log(headers.get('authorization'));
  // console.log('============================');

  return NextResponse.json({
    cookies: allCookies.map((c) => ({
      name: c.name,
      value: c.value.substring(0, 20) + '...', // Truncate for security
    })),
    cookieCount: allCookies.length,
    sessionToken: allCookies.find((c) => c.name.includes('session'))?.name || 'NONE FOUND',
    authHeader: headers.get('authorization') || 'NONE',
  });
}
