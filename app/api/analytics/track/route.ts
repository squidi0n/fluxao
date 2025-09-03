import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionId, hashIpAddress, hasAnalyticsConsent } from '@/lib/analytics';
import { logger } from '@/lib/logger';

// Device type detection
function getDeviceType(userAgent: string): 'DESKTOP' | 'MOBILE' | 'TABLET' | 'BOT' | 'UNKNOWN' {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('bot') || ua.includes('crawl') || ua.includes('spider')) {
    return 'BOT';
  }
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'TABLET';
  }
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'MOBILE';
  }
  
  return 'DESKTOP';
}

// Browser detection
function getBrowserName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  
  return 'Unknown';
}

// OS detection
function getOSName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios')) return 'iOS';
  
  return 'Unknown';
}

// Activity type mapping
const ACTIVITY_TYPE_MAP: Record<string, any> = {
  'page_view': 'PAGE_VIEW',
  'article_view': 'PAGE_VIEW',
  'scroll': 'SCROLL',
  'article_scroll': 'SCROLL',
  'click': 'CLICK',
  'share': 'SHARE',
  'article_share': 'SHARE',
  'comment': 'COMMENT',
  'article_comment': 'COMMENT',
  'like': 'LIKE',
  'article_vote': 'LIKE',
  'copy': 'COPY_TEXT',
  'content_copy': 'COPY_TEXT',
  'text_selection': 'COPY_TEXT',
  'search': 'SEARCH',
  'newsletter_signup': 'NEWSLETTER_SIGNUP',
  'subscription': 'SUBSCRIPTION',
  'outbound_click': 'CLICK',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      postId,
      properties = {},
      timeOnPage,
      scrollPercentage,
      clickData,
      exitPage = false,
    } = body;

    // Get request metadata
    const sessionId = getSessionId(request);
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || '';
    const referrer = request.headers.get('referer');

    // Check consent (required for detailed tracking)
    const hasConsent = await hasAnalyticsConsent(sessionId);
    
    // Allow basic page views without consent for essential functionality
    if (!hasConsent && type !== 'page_view' && type !== 'article_view') {
      return NextResponse.json({ success: true, message: 'Tracking skipped - no consent' });
    }

    // Get device info
    const deviceType = getDeviceType(userAgent);
    const browserName = getBrowserName(userAgent);
    const osName = getOSName(userAgent);

    // Map activity type
    const activityType = ACTIVITY_TYPE_MAP[type] || 'CLICK';

    // Hash IP address for privacy
    const ipHash = ipAddress ? await hashIpAddress(ipAddress) : null;

    // Get user ID if authenticated
    // Note: You might want to get this from session/JWT in your actual implementation
    const userId = properties.userId || null;

    // Create user activity record
    const userActivity = await prisma.userActivity.create({
      data: {
        postId: postId || null,
        sessionId,
        userId,
        activityType,
        timeOnPage: timeOnPage || null,
        scrollPercentage: scrollPercentage || null,
        clickData: clickData || null,
        exitPage,
        referrer: referrer || null,
        userAgent: hasConsent ? userAgent : null,
        ipHash: hasConsent ? ipHash : null,
        deviceType,
        browserName: hasConsent ? browserName : null,
        osName: hasConsent ? osName : null,
        consentGiven: hasConsent,
      },
    });

    // If this is article-specific tracking, update/create PostAnalytics
    if (postId) {
      await updatePostAnalytics(postId, activityType, scrollPercentage || 0, timeOnPage || 0);
    }

    // Update session analytics
    await updateSessionAnalytics(sessionId, userId, referrer, deviceType, browserName, osName, hasConsent);

    logger.debug({
      type,
      postId,
      sessionId,
      hasConsent,
      activityType,
    }, 'User activity tracked');

    return NextResponse.json({ 
      success: true, 
      activityId: userActivity.id,
      hasConsent 
    });

  } catch (error) {
    logger.error({ error }, 'Failed to track user activity');
    
    // Don't fail the request - analytics should not break the app
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Update post analytics aggregates
async function updatePostAnalytics(
  postId: string, 
  activityType: string, 
  scrollPercentage: number,
  timeOnPage: number
) {
  try {
    // Get or create PostAnalytics record
    let postAnalytics = await prisma.postAnalytics.findUnique({
      where: { postId },
    });

    if (!postAnalytics) {
      postAnalytics = await prisma.postAnalytics.create({
        data: { postId },
      });
    }

    // Update based on activity type
    const updateData: any = {};

    if (activityType === 'PAGE_VIEW') {
      updateData.views = { increment: 1 };
    }

    if (activityType === 'SHARE') {
      updateData.shareCount = { increment: 1 };
    }

    if (activityType === 'LIKE') {
      updateData.likeCount = { increment: 1 };
    }

    if (activityType === 'COMMENT') {
      updateData.commentCount = { increment: 1 };
    }

    // Update scroll depth if provided
    if (scrollPercentage > 0 && scrollPercentage > postAnalytics.scrollDepth) {
      updateData.scrollDepth = scrollPercentage;
    }

    // Update average read time (simple approach)
    if (timeOnPage > 0) {
      const currentAvg = postAnalytics.avgReadTime;
      const newAvg = currentAvg > 0 ? (currentAvg + timeOnPage) / 2 : timeOnPage;
      updateData.avgReadTime = newAvg;
    }

    // Calculate engagement score (simple formula)
    const engagementScore = Math.min(100, (
      (scrollPercentage * 0.4) + 
      (Math.min(timeOnPage / 60, 10) * 6) + // Max 10 minutes = 60 points
      (postAnalytics.shareCount * 5) +
      (postAnalytics.commentCount * 3) +
      (postAnalytics.likeCount * 2)
    ));
    
    if (engagementScore > postAnalytics.engagementScore) {
      updateData.engagementScore = engagementScore;
    }

    // Apply updates if any
    if (Object.keys(updateData).length > 0) {
      await prisma.postAnalytics.update({
        where: { postId },
        data: updateData,
      });
    }

  } catch (error) {
    logger.error({ error, postId }, 'Failed to update post analytics');
  }
}

// Update session analytics
async function updateSessionAnalytics(
  sessionId: string,
  userId: string | null,
  referrer: string | null,
  deviceType: string,
  browserName: string,
  osName: string,
  hasConsent: boolean
) {
  try {
    const sessionData = {
      sessionId,
      userId,
      referrer: referrer || null,
      deviceType: deviceType as any,
      browserName: hasConsent ? browserName : null,
      osName: hasConsent ? osName : null,
      consentGiven: hasConsent,
    };

    await prisma.sessionAnalytics.upsert({
      where: { sessionId },
      create: {
        ...sessionData,
        pageViews: 1,
        totalTime: 0,
      },
      update: {
        pageViews: { increment: 1 },
        endedAt: new Date(),
      },
    });

  } catch (error) {
    logger.error({ error, sessionId }, 'Failed to update session analytics');
  }
}