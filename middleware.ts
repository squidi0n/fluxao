import { auth } from './auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;

  console.log(`🔍 Middleware: ${nextUrl.pathname}`, {
    isLoggedIn,
    userEmail: session?.user?.email,
    userRole: session?.user?.role
  });

  // Admin routes protection
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', nextUrl.origin);
      loginUrl.searchParams.set('from', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check for elevated admin users
    const elevatedAdmins = process.env.ELEVATED_ADMIN_EMAILS?.split(',') || [];
    if (elevatedAdmins.includes(session.user.email || '')) {
      return NextResponse.next();
    }

    // Admin role required
    if (session.user.role !== 'ADMIN' && !session.user.isAdmin) {
      return NextResponse.redirect(new URL('/', nextUrl.origin));
    }
  }

  // Profile/settings routes protection
  if (nextUrl.pathname.startsWith('/profile') || nextUrl.pathname.startsWith('/settings')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', nextUrl.origin);
      loginUrl.searchParams.set('from', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Editor routes protection
  if (nextUrl.pathname.startsWith('/editor')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', nextUrl.origin);
      loginUrl.searchParams.set('from', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!['EDITOR', 'ADMIN'].includes(session.user.role || '')) {
      return NextResponse.redirect(new URL('/', nextUrl.origin));
    }
  }

  // Premium routes protection
  if (nextUrl.pathname.startsWith('/premium')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', nextUrl.origin);
      loginUrl.searchParams.set('from', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!['PREMIUM', 'EDITOR', 'ADMIN'].includes(session.user.role || '')) {
      return NextResponse.redirect(new URL('/pricing', nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/editor',
    '/editor/:path*', 
    '/premium',
    '/premium/:path*',
    '/profile',
    '/profile/:path*',
    '/settings',
    '/settings/:path*'
  ],
};
