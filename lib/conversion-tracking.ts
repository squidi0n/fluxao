import { trackAnalyticsEvent } from './analytics';
import { logger } from './logger';
import { prisma } from './prisma';

export interface ConversionFunnel {
  stage: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface ConversionData {
  source: string;
  variant?: string;
  stage: 'view' | 'click' | 'signup' | 'verification' | 'engagement';
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ConversionMetrics {
  totalViews: number;
  totalClicks: number;
  totalSignups: number;
  totalVerifications: number;
  clickRate: number;
  signupRate: number;
  verificationRate: number;
  overallConversionRate: number;
}

// Track conversion events
export async function trackConversion(data: ConversionData): Promise<void> {
  try {
    // Record in database
    await prisma.conversionEvent.create({
      data: {
        source: data.source,
        variant: data.variant,
        stage: data.stage,
        sessionId: data.sessionId,
        userId: data.userId,
        metadata: data.metadata || {},
        createdAt: new Date(),
      },
    });

    // Also track in analytics system
    await trackAnalyticsEvent({
      type: `newsletter_${data.stage}`,
      sessionId: data.sessionId,
      properties: {
        source: data.source,
        variant: data.variant,
        ...data.metadata,
      },
    });

    logger.debug(
      {
        source: data.source,
        variant: data.variant,
        stage: data.stage,
        sessionId: data.sessionId.substring(0, 8) + '...',
      },
      'Conversion event tracked',
    );
  } catch (error) {
    logger.error({ error, data }, 'Failed to track conversion');
  }
}

// Get conversion funnel analysis
export async function getConversionFunnel(
  source?: string,
  variant?: string,
  timeframe: '24h' | '7d' | '30d' = '7d',
): Promise<ConversionFunnel[]> {
  try {
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
    }

    const whereClause = {
      createdAt: { gte: startDate },
      ...(source && { source }),
      ...(variant && { variant }),
    };

    // Get stage counts
    const stageCounts = await prisma.conversionEvent.groupBy({
      by: ['stage'],
      where: whereClause,
      _count: {
        sessionId: true,
      },
    });

    // Get unique sessions per stage
    const uniqueSessions = await Promise.all([
      // Views
      prisma.conversionEvent
        .findMany({
          where: { ...whereClause, stage: 'view' },
          select: { sessionId: true },
          distinct: ['sessionId'],
        })
        .then((results) => ({ stage: 'view', count: results.length })),

      // Clicks
      prisma.conversionEvent
        .findMany({
          where: { ...whereClause, stage: 'click' },
          select: { sessionId: true },
          distinct: ['sessionId'],
        })
        .then((results) => ({ stage: 'click', count: results.length })),

      // Signups
      prisma.conversionEvent
        .findMany({
          where: { ...whereClause, stage: 'signup' },
          select: { sessionId: true },
          distinct: ['sessionId'],
        })
        .then((results) => ({ stage: 'signup', count: results.length })),

      // Verifications
      prisma.conversionEvent
        .findMany({
          where: { ...whereClause, stage: 'verification' },
          select: { sessionId: true },
          distinct: ['sessionId'],
        })
        .then((results) => ({ stage: 'verification', count: results.length })),
    ]);

    // Build funnel
    const stages = ['view', 'click', 'signup', 'verification'];
    const funnel: ConversionFunnel[] = [];

    let previousStageVisitors = 0;

    for (const stage of stages) {
      const stageData = uniqueSessions.find((s) => s.stage === stage);
      const visitors = stageData?.count || 0;

      // For first stage, visitors are the total
      const stageVisitors = stage === 'view' ? visitors : previousStageVisitors;
      const conversions = visitors;

      const conversionRate = stageVisitors > 0 ? (conversions / stageVisitors) * 100 : 0;
      const dropOffRate =
        stageVisitors > 0 ? ((stageVisitors - conversions) / stageVisitors) * 100 : 0;

      funnel.push({
        stage,
        visitors: stageVisitors,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropOffRate: Math.round(dropOffRate * 100) / 100,
      });

      previousStageVisitors = conversions;
    }

    return funnel;
  } catch (error) {
    logger.error({ error }, 'Failed to get conversion funnel');
    return [];
  }
}

// Get detailed conversion metrics
export async function getConversionMetrics(
  source?: string,
  variant?: string,
  timeframe: '24h' | '7d' | '30d' = '7d',
): Promise<ConversionMetrics> {
  try {
    const funnel = await getConversionFunnel(source, variant, timeframe);

    const views = funnel.find((s) => s.stage === 'view');
    const clicks = funnel.find((s) => s.stage === 'click');
    const signups = funnel.find((s) => s.stage === 'signup');
    const verifications = funnel.find((s) => s.stage === 'verification');

    const totalViews = views?.conversions || 0;
    const totalClicks = clicks?.conversions || 0;
    const totalSignups = signups?.conversions || 0;
    const totalVerifications = verifications?.conversions || 0;

    const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const signupRate = totalClicks > 0 ? (totalSignups / totalClicks) * 100 : 0;
    const verificationRate = totalSignups > 0 ? (totalVerifications / totalSignups) * 100 : 0;
    const overallConversionRate = totalViews > 0 ? (totalVerifications / totalViews) * 100 : 0;

    return {
      totalViews,
      totalClicks,
      totalSignups,
      totalVerifications,
      clickRate: Math.round(clickRate * 100) / 100,
      signupRate: Math.round(signupRate * 100) / 100,
      verificationRate: Math.round(verificationRate * 100) / 100,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get conversion metrics');
    return {
      totalViews: 0,
      totalClicks: 0,
      totalSignups: 0,
      totalVerifications: 0,
      clickRate: 0,
      signupRate: 0,
      verificationRate: 0,
      overallConversionRate: 0,
    };
  }
}

// Compare conversion rates between variants
export async function compareVariants(
  testId: string,
  timeframe: '24h' | '7d' | '30d' = '7d',
): Promise<
  {
    variant: string;
    metrics: ConversionMetrics;
    improvement: number;
  }[]
> {
  try {
    // Get test variants
    const test = await prisma.aBTest.findUnique({
      where: { id: testId },
      include: { variants: true },
    });

    if (!test) {
      return [];
    }

    // Get metrics for each variant
    const variantMetrics = await Promise.all(
      test.variants.map(async (variant) => {
        const metrics = await getConversionMetrics(undefined, variant.id, timeframe);
        return {
          variant: variant.name,
          variantId: variant.id,
          metrics,
        };
      }),
    );

    // Calculate improvements relative to control (first variant)
    const control = variantMetrics[0];

    return variantMetrics.map((variant, index) => {
      const improvement =
        index === 0
          ? 0 // Control has no improvement
          : control.metrics.overallConversionRate > 0
            ? ((variant.metrics.overallConversionRate - control.metrics.overallConversionRate) /
                control.metrics.overallConversionRate) *
              100
            : 0;

      return {
        variant: variant.variant,
        metrics: variant.metrics,
        improvement: Math.round(improvement * 100) / 100,
      };
    });
  } catch (error) {
    logger.error({ error, testId }, 'Failed to compare variants');
    return [];
  }
}

// Get top performing sources
export async function getTopSources(
  limit: number = 10,
  timeframe: '24h' | '7d' | '30d' = '7d',
): Promise<
  {
    source: string;
    metrics: ConversionMetrics;
  }[]
> {
  try {
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
    }

    // Get unique sources
    const sources = await prisma.conversionEvent.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: { source: true },
      distinct: ['source'],
    });

    // Get metrics for each source
    const sourceMetrics = await Promise.all(
      sources.map(async ({ source }) => {
        const metrics = await getConversionMetrics(source, undefined, timeframe);
        return {
          source,
          metrics,
        };
      }),
    );

    // Sort by overall conversion rate
    return sourceMetrics
      .filter((s) => s.metrics.totalViews > 0)
      .sort((a, b) => b.metrics.overallConversionRate - a.metrics.overallConversionRate)
      .slice(0, limit);
  } catch (error) {
    logger.error({ error }, 'Failed to get top sources');
    return [];
  }
}

// Track newsletter verification (when user confirms email)
export async function trackNewsletterVerification(
  email: string,
  source?: string,
  variant?: string,
): Promise<void> {
  try {
    // Find the original signup to get session info
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return;
    }

    // For now, we'll use a generated session ID since we don't store it
    // In a real implementation, you'd want to store session info with the subscriber
    const sessionId = `verification_${subscriber.id}`;

    await trackConversion({
      source: source || 'unknown',
      variant: variant,
      stage: 'verification',
      sessionId,
      metadata: {
        email: email.substring(0, 3) + '***', // Anonymized
        subscriberId: subscriber.id,
      },
    });
  } catch (error) {
    logger.error({ error, email }, 'Failed to track newsletter verification');
  }
}

// Initialize conversion tracking for newsletter
export async function initializeConversionTracking(): Promise<void> {
  try {
    // This would set up any initial tracking configuration
    logger.info('Conversion tracking initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize conversion tracking');
  }
}
