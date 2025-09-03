import crypto from 'crypto';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'default-csrf-secret';

export class CSRFProtection {
  private static instance: CSRFProtection;

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  generateToken(): string {
    const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
    const timestamp = Date.now();
    const data = `${token}.${timestamp}`;
    const signature = this.sign(data);
    return `${data}.${signature}`;
  }

  private sign(data: string): string {
    return crypto.createHmac('sha256', CSRF_SECRET).update(data).digest('hex');
  }

  validateToken(token: string | null): boolean {
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const [tokenPart, timestampStr, signature] = parts;
      const timestamp = parseInt(timestampStr, 10);

      // Check token age (24 hours)
      const age = Date.now() - timestamp;
      if (age > 24 * 60 * 60 * 1000) return false;

      // Verify signature
      const data = `${tokenPart}.${timestampStr}`;
      const expectedSignature = this.sign(data);

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      // console.error('CSRF token validation error:', error);
      return false;
    }
  }

  async protect(req: NextRequest): Promise<NextResponse | null> {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return null;
    }

    // Get token from header or body
    const headerToken = req.headers.get(CSRF_HEADER_NAME);
    const cookieToken = (await cookies()).get(CSRF_COOKIE_NAME)?.value;

    // For API routes, check header token
    if (req.nextUrl.pathname.startsWith('/api/')) {
      if (!this.validateToken(headerToken)) {
        return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
      }
    }

    // For form submissions, check cookie token
    if (cookieToken && !this.validateToken(cookieToken)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    return null;
  }

  async setTokenCookie(response: NextResponse): Promise<void> {
    const token = this.generateToken();
    const cookieStore = await cookies();

    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });
  }
}

export const csrf = CSRFProtection.getInstance();
