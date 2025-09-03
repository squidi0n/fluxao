import { logger } from './logger';
import { prisma } from './prisma';

export interface AnalyticsEvent {
  type: string;
  path?: string;
  properties?: Record<string, any>;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  country?: string;
  consentGiven?: boolean;
}

export interface ConsentData {
  analytics: boolean;
  marketing: boolean;
}

// Event types
export const ANALYTICS_EVENTS = {
  PAGEVIEW: 'pageview',
  NEWSLETTER_SIGNUP: 'newsletter_signup',
  NEWSLETTER_CONFIRM: 'newsletter_confirm',
  COMMENT_POSTED: 'comment_posted',
  SHARE_ARTICLE: 'share_article',
  DOWNLOAD: 'download',
  SEARCH: 'search',
  OUTBOUND_CLICK: 'outbound_click',
  CTA_CLICK: 'cta_click',
  CONTACT_FORM: 'contact_form',
} as const;

// Privacy-first analytics configuration
export const ANALYTICS_CONFIG = {
  // Session duration (30 minutes of inactivity)
  SESSION_TIMEOUT: 30 * 60 * 1000,
  // Consent expires after 13 months per GDPR
  CONSENT_DURATION: 13 * 30 * 24 * 60 * 60 * 1000,
  // Hash salt for IP addresses
  HASH_SALT: process.env.ANALYTICS_HASH_SALT || 'fluxao-analytics-salt',
  // Enable third-party analytics (Plausible/Umami)
  ENABLE_EXTERNAL: process.env.ANALYTICS_EXTERNAL === 'true',
  // External analytics domain/endpoint
  EXTERNAL_DOMAIN: process.env.ANALYTICS_DOMAIN,
  EXTERNAL_API_KEY: process.env.ANALYTICS_API_KEY,
};

// Generate anonymous session ID (Edge Runtime compatible)
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for Edge Runtime
  return (
    'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }) +
    '-' +
    Date.now().toString(36)
  );
}

// Hash IP address for privacy (Edge Runtime compatible)
export async function hashIpAddress(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + ANALYTICS_CONFIG.HASH_SALT);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16);
  }

  // Simple fallback hash for Edge Runtime
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 16);
}

// Get or create session ID from request
export function getSessionId(request: Request): string {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map((cookie) => {
        const [key, value] = cookie.split('=');
        return [key, decodeURIComponent(value)];
      }),
    );

    if (cookies.session_id) {
      return cookies.session_id;
    }
  }

  return generateSessionId();
}

// Check if user has given analytics consent
export async function hasAnalyticsConsent(sessionId: string): Promise<boolean> {
  try {
    const consent = await prisma.consentRecord.findUnique({
      where: { sessionId },
    });

    if (!consent) return false;

    // Check if consent has expired
    if (consent.expiresAt < new Date()) {
      // Clean up expired consent
      await prisma.consentRecord
        .delete({
          where: { sessionId },
        })
        .catch(() => {}); // Ignore deletion errors
      return false;
    }

    return consent.analyticsConsent;
  } catch (error) {
    logger.error({ error }, 'Failed to check analytics consent');
    return false;
  }
}

// Record consent choice
export async function recordConsent(
  sessionId: string,
  consent: ConsentData,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ANALYTICS_CONFIG.CONSENT_DURATION);

    await prisma.consentRecord.upsert({
      where: { sessionId },
      update: {
        analyticsConsent: consent.analytics,
        marketingConsent: consent.marketing,
        lastUpdated: new Date(),
        expiresAt,
      },
      create: {
        sessionId,
        analyticsConsent: consent.analytics,
        marketingConsent: consent.marketing,
        ipAddress: ipAddress ? await hashIpAddress(ipAddress) : null,
        userAgent,
        consentGivenAt: new Date(),
        expiresAt,
      },
    });

    logger.info(
      {
        sessionId,
        analytics: consent.analytics,
        marketing: consent.marketing,
      },
      'Consent recorded',
    );
  } catch (error) {
    logger.error({ error, sessionId }, 'Failed to record consent');
    throw error;
  }
}

// Track analytics event
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // Always check consent first
    if (event.sessionId) {
      const hasConsent = await hasAnalyticsConsent(event.sessionId);
      if (!hasConsent && event.type !== ANALYTICS_EVENTS.PAGEVIEW) {
        // Allow basic pageviews without consent for essential functionality
        logger.debug({ type: event.type }, 'Event blocked due to missing consent');
        return;
      }
      event.consentGiven = hasConsent;
    }

    // Store event in database
    await prisma.analyticsEvent.create({
      data: {
        type: event.type,
        path: event.path,
        properties: event.properties || {},
        sessionId: event.sessionId,
        userAgent: event.userAgent,
        ipAddress: event.ipAddress ? await hashIpAddress(event.ipAddress) : null,
        referrer: event.referrer,
        country: event.country,
        consentGiven: event.consentGiven || false,
      },
    });

    // Send to external analytics if enabled and consent given
    if (ANALYTICS_CONFIG.ENABLE_EXTERNAL && event.consentGiven) {
      await sendToExternalAnalytics(event);
    }

    logger.debug(
      {
        type: event.type,
        path: event.path,
        consent: event.consentGiven,
      },
      'Analytics event tracked',
    );
  } catch (error) {
    logger.error({ error, event }, 'Failed to track analytics event');
    // Don't throw - analytics should not break the application
  }
}

// Send event to external analytics (Plausible/Umami)
async function sendToExternalAnalytics(event: AnalyticsEvent): Promise<void> {
  if (!ANALYTICS_CONFIG.EXTERNAL_DOMAIN) return;

  try {
    // Plausible-style event
    const payload = {
      name: event.type,
      url: event.path ? `${process.env.NEXTAUTH_URL}${event.path}` : undefined,
      domain: ANALYTICS_CONFIG.EXTERNAL_DOMAIN,
      referrer: event.referrer,
      props: event.properties,
    };

    const response = await fetch('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': event.userAgent || 'FluxAO/1.0',
        ...(ANALYTICS_CONFIG.EXTERNAL_API_KEY && {
          Authorization: `Bearer ${ANALYTICS_CONFIG.EXTERNAL_API_KEY}`,
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`External analytics failed: ${response.status}`);
    }

    logger.debug({ type: event.type }, 'Event sent to external analytics');
  } catch (error) {
    logger.error({ error }, 'Failed to send event to external analytics');
  }
}

// Get analytics summary
export interface AnalyticsSummary {
  pageviews: number;
  uniqueVisitors: number;
  topPages: Array<{ path: string; views: number }>;
  events: Array<{ type: string; count: number }>;
  timeframe: string;
}

export async function getAnalyticsSummary(timeframe = '7d'): Promise<AnalyticsSummary> {
  const now = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case '24h':
      startDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  try {
    const [pageviews, uniqueVisitors, topPages, events] = await Promise.all([
      // Total pageviews
      prisma.analyticsEvent.count({
        where: {
          type: ANALYTICS_EVENTS.PAGEVIEW,
          createdAt: { gte: startDate },
          consentGiven: true,
        },
      }),

      // Unique visitors (by session)
      prisma.analyticsEvent
        .findMany({
          where: {
            type: ANALYTICS_EVENTS.PAGEVIEW,
            createdAt: { gte: startDate },
            consentGiven: true,
            sessionId: { not: null },
          },
          select: { sessionId: true },
          distinct: ['sessionId'],
        })
        .then((results) => results.length),

      // Top pages
      prisma.analyticsEvent
        .groupBy({
          by: ['path'],
          where: {
            type: ANALYTICS_EVENTS.PAGEVIEW,
            createdAt: { gte: startDate },
            consentGiven: true,
            path: { not: null },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        })
        .then((results) =>
          results.map((r) => ({
            path: r.path || '',
            views: r._count.id,
          })),
        ),

      // Event counts
      prisma.analyticsEvent
        .groupBy({
          by: ['type'],
          where: {
            createdAt: { gte: startDate },
            consentGiven: true,
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        })
        .then((results) =>
          results.map((r) => ({
            type: r.type,
            count: r._count.id,
          })),
        ),
    ]);

    return {
      pageviews,
      uniqueVisitors,
      topPages,
      events,
      timeframe,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get analytics summary');
    return {
      pageviews: 0,
      uniqueVisitors: 0,
      topPages: [],
      events: [],
      timeframe,
    };
  }
}

// Clean up old analytics data
export async function cleanupAnalytics(retentionDays = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    const [eventsDeleted, consentDeleted] = await Promise.all([
      prisma.analyticsEvent.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      }),
      prisma.consentRecord.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      }),
    ]);

    const totalDeleted = eventsDeleted.count + consentDeleted.count;
    logger.info(
      {
        eventsDeleted: eventsDeleted.count,
        consentDeleted: consentDeleted.count,
        retentionDays,
      },
      'Analytics cleanup completed',
    );

    return totalDeleted;
  } catch (error) {
    logger.error({ error }, 'Analytics cleanup failed');
    return 0;
  }
}
