import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { trackEvent, getSessionId, ANALYTICS_EVENTS } from '@/lib/analytics';
import { createProblemResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';

// POST /api/analytics/log - Log analytics event
const AnalyticsEventSchema = z.object({
  type: z.enum([
    ANALYTICS_EVENTS.PAGEVIEW,
    ANALYTICS_EVENTS.NEWSLETTER_SIGNUP,
    ANALYTICS_EVENTS.NEWSLETTER_CONFIRM,
    ANALYTICS_EVENTS.COMMENT_POSTED,
    ANALYTICS_EVENTS.SHARE_ARTICLE,
    ANALYTICS_EVENTS.DOWNLOAD,
    ANALYTICS_EVENTS.SEARCH,
    ANALYTICS_EVENTS.OUTBOUND_CLICK,
    ANALYTICS_EVENTS.CTA_CLICK,
    ANALYTICS_EVENTS.CONTACT_FORM,
  ] as const),
  path: z.string().optional(),
  properties: z.record(z.any()).optional(),
  referrer: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = AnalyticsEventSchema.safeParse(body);

    if (!validation.success) {
      return createProblemResponse({
        status: 400,
        title: 'Validation Error',
        detail: validation.error.errors[0].message,
      });
    }

    const { type, path, properties, referrer } = validation.data;
    const sessionId = getSessionId(request);
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Get country from Cloudflare header if available
    const country = request.headers.get('cf-ipcountry') || undefined;

    // Track the event (consent checking happens in trackEvent)
    await trackEvent({
      type,
      path,
      properties,
      sessionId,
      userAgent,
      ipAddress,
      referrer,
      country,
    });

    logger.debug(
      {
        type,
        path,
        sessionId: sessionId.substring(0, 8) + '...',
      },
      'Analytics event logged',
    );

    return NextResponse.json({
      success: true,
      sessionId,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to log analytics event');
    return createProblemResponse({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Failed to log analytics event',
    });
  }
}
