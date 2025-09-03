import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recordConsent, getSessionId } from '@/lib/analytics';
import { createProblemResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';

// POST /api/analytics/consent - Record user consent
const ConsentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ConsentSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const { analytics, marketing } = validation.data;
    const sessionId = getSessionId(request);
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Record consent
    await recordConsent(sessionId, { analytics, marketing }, ipAddress, userAgent);

    // Set session cookie for 13 months (consent duration)
    const response = NextResponse.json({
      success: true,
      sessionId,
      consent: { analytics, marketing },
    });

    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 13 * 30 * 24 * 60 * 60, // 13 months in seconds
      path: '/',
    });

    // Set consent preferences cookie for client-side access
    response.cookies.set('consent_prefs', JSON.stringify({ analytics, marketing }), {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 13 * 30 * 24 * 60 * 60, // 13 months in seconds
      path: '/',
    });

    logger.info(
      {
        sessionId,
        analytics,
        marketing,
        ipAddress: ipAddress.substring(0, 8) + '...',
      },
      'Consent recorded',
    );

    return response;
  } catch (error) {
    logger.error({ error }, 'Failed to record consent');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to record consent',
    });
  }
}

// GET /api/analytics/consent - Check current consent status
export async function GET(request: NextRequest) {
  try {
    const sessionId = getSessionId(request);

    // Check if there's a consent preferences cookie
    const consentCookie = request.cookies.get('consent_prefs')?.value;
    if (consentCookie) {
      try {
        const consent = JSON.parse(consentCookie);
        return NextResponse.json({
          hasConsent: true,
          consent,
          sessionId,
        });
      } catch {
        // Invalid cookie, continue to check database
      }
    }

    // Check database for consent record
    const { hasAnalyticsConsent } = await import('@/lib/analytics');
    const hasConsent = await hasAnalyticsConsent(sessionId);

    if (hasConsent) {
      // Get full consent record from database
      const { prisma } = await import('@/lib/prisma');
      const consentRecord = await prisma.consentRecord.findUnique({
        where: { sessionId },
      });

      if (consentRecord) {
        return NextResponse.json({
          hasConsent: true,
          consent: {
            analytics: consentRecord.analyticsConsent,
            marketing: consentRecord.marketingConsent,
          },
          sessionId,
        });
      }
    }

    return NextResponse.json({
      hasConsent: false,
      consent: null,
      sessionId,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to check consent status');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to check consent status',
    });
  }
}
