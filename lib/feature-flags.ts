import { logger } from './logger';
import { prisma } from './prisma';

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  percentage: number; // 0-100, percentage of users who see the feature
  userIds?: string[]; // Specific users to enable/disable for
  conditions?: Record<string, any>; // Additional conditions
  createdAt: Date;
  updatedAt: Date;
}

export interface FlagEvaluation {
  flagId: string;
  enabled: boolean;
  reason: string;
  userId?: string;
  sessionId?: string;
}

// Growth experiment feature flags
export const GROWTH_FLAGS = {
  EXIT_INTENT_POPUP: 'growth_exit_intent_popup',
  NEWSLETTER_MODAL_TRIGGER: 'growth_newsletter_modal_trigger',
  SCROLL_TRIGGER_NEWSLETTER: 'growth_scroll_trigger_newsletter',
  TIME_DELAYED_POPUP: 'growth_time_delayed_popup',
  SOCIAL_PROOF_BADGES: 'growth_social_proof_badges',
  URGENCY_MESSAGING: 'growth_urgency_messaging',
  PERSONALIZED_CONTENT: 'growth_personalized_content',
  GAMIFICATION_ELEMENTS: 'growth_gamification_elements',
} as const;

// Check if feature flag is enabled for user/session
export async function isFeatureEnabled(
  flagId: string,
  userId?: string,
  sessionId?: string,
  context?: Record<string, any>,
): Promise<FlagEvaluation> {
  try {
    // Get flag from database
    const flag = await prisma.featureFlag.findUnique({
      where: { id: flagId },
    });

    if (!flag) {
      return {
        flagId,
        enabled: false,
        reason: 'Flag not found',
        userId,
        sessionId,
      };
    }

    if (!flag.enabled) {
      return {
        flagId,
        enabled: false,
        reason: 'Flag disabled globally',
        userId,
        sessionId,
      };
    }

    // Check specific user overrides
    if (userId && flag.userIds) {
      const userIds = Array.isArray(flag.userIds) ? flag.userIds : [];
      if (userIds.includes(userId)) {
        return {
          flagId,
          enabled: true,
          reason: 'User explicitly enabled',
          userId,
          sessionId,
        };
      }
    }

    // Check percentage rollout
    const identifier = userId || sessionId || 'anonymous';
    if (flag.percentage < 100) {
      const hash = simpleHash(flagId + identifier);
      const bucket = hash % 100;

      if (bucket >= flag.percentage) {
        return {
          flagId,
          enabled: false,
          reason: `Outside percentage rollout (${flag.percentage}%)`,
          userId,
          sessionId,
        };
      }
    }

    // Check additional conditions
    if (flag.conditions && Object.keys(flag.conditions).length > 0) {
      const conditionsMet = evaluateConditions(flag.conditions, context || {});
      if (!conditionsMet) {
        return {
          flagId,
          enabled: false,
          reason: 'Conditions not met',
          userId,
          sessionId,
        };
      }
    }

    return {
      flagId,
      enabled: true,
      reason: 'All conditions passed',
      userId,
      sessionId,
    };
  } catch (error) {
    logger.error({ error, flagId, userId, sessionId }, 'Failed to evaluate feature flag');
    return {
      flagId,
      enabled: false,
      reason: 'Evaluation error',
      userId,
      sessionId,
    };
  }
}

// Simple hash function for consistent bucketing
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Evaluate conditions (simple implementation)
function evaluateConditions(
  conditions: Record<string, any>,
  context: Record<string, any>,
): boolean {
  try {
    // Simple condition evaluation - can be extended
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const contextValue = context[key];

      if (expectedValue !== contextValue) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error({ error, conditions, context }, 'Failed to evaluate conditions');
    return false;
  }
}

// Get all feature flags for admin interface
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    return await prisma.featureFlag.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get feature flags');
    return [];
  }
}

// Update feature flag
export async function updateFeatureFlag(
  flagId: string,
  updates: Partial<Pick<FeatureFlag, 'enabled' | 'percentage' | 'conditions' | 'description'>>,
): Promise<FeatureFlag | null> {
  try {
    const flag = await prisma.featureFlag.update({
      where: { id: flagId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    logger.info({ flagId, updates }, 'Feature flag updated');
    return flag;
  } catch (error) {
    logger.error({ error, flagId, updates }, 'Failed to update feature flag');
    return null;
  }
}

// Create or update feature flag
export async function upsertFeatureFlag(
  flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>,
): Promise<FeatureFlag> {
  try {
    const result = await prisma.featureFlag.upsert({
      where: { id: flag.id },
      update: {
        name: flag.name,
        description: flag.description,
        enabled: flag.enabled,
        percentage: flag.percentage,
        userIds: flag.userIds,
        conditions: flag.conditions,
        updatedAt: new Date(),
      },
      create: {
        id: flag.id,
        name: flag.name,
        description: flag.description,
        enabled: flag.enabled,
        percentage: flag.percentage,
        userIds: flag.userIds,
        conditions: flag.conditions,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.info({ flagId: flag.id }, 'Feature flag upserted');
    return result;
  } catch (error) {
    logger.error({ error, flag }, 'Failed to upsert feature flag');
    throw error;
  }
}

// Initialize growth experiment flags
export async function initializeGrowthFlags(): Promise<void> {
  try {
    const growthFlags = [
      {
        id: GROWTH_FLAGS.EXIT_INTENT_POPUP,
        name: 'Exit Intent Popup',
        description: 'Show newsletter popup when user tries to leave the page',
        enabled: true,
        percentage: 50,
        conditions: {},
      },
      {
        id: GROWTH_FLAGS.NEWSLETTER_MODAL_TRIGGER,
        name: 'Newsletter Modal Trigger',
        description: 'Show newsletter as modal instead of inline form',
        enabled: true,
        percentage: 50,
        conditions: {},
      },
      {
        id: GROWTH_FLAGS.SCROLL_TRIGGER_NEWSLETTER,
        name: 'Scroll Trigger Newsletter',
        description: 'Show newsletter popup after scrolling 70% of page',
        enabled: true,
        percentage: 30,
        conditions: { pageType: 'blog-post' },
      },
      {
        id: GROWTH_FLAGS.TIME_DELAYED_POPUP,
        name: 'Time Delayed Popup',
        description: 'Show newsletter popup after 30 seconds on page',
        enabled: false,
        percentage: 20,
        conditions: {},
      },
      {
        id: GROWTH_FLAGS.SOCIAL_PROOF_BADGES,
        name: 'Social Proof Badges',
        description: 'Show subscriber count and testimonials',
        enabled: true,
        percentage: 100,
        conditions: {},
      },
      {
        id: GROWTH_FLAGS.URGENCY_MESSAGING,
        name: 'Urgency Messaging',
        description: 'Add urgency elements to newsletter signups',
        enabled: false,
        percentage: 25,
        conditions: {},
      },
      {
        id: GROWTH_FLAGS.PERSONALIZED_CONTENT,
        name: 'Personalized Content',
        description: 'Show personalized newsletter content based on user behavior',
        enabled: false,
        percentage: 10,
        conditions: { hasProfile: true },
      },
      {
        id: GROWTH_FLAGS.GAMIFICATION_ELEMENTS,
        name: 'Gamification Elements',
        description: 'Add progress bars, badges, and achievements',
        enabled: false,
        percentage: 5,
        conditions: { experimentalFeatures: true },
      },
    ];

    for (const flag of growthFlags) {
      await upsertFeatureFlag(flag);
    }

    logger.info('Growth experiment flags initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize growth flags');
  }
}

// React hook for feature flags
export function useFeatureFlag(
  flagId: string,
  userId?: string,
  sessionId?: string,
  context?: Record<string, any>,
) {
  // This would be implemented as a React hook in a real application
  // For now, it's a placeholder that would need to be integrated with React
  return {
    isEnabled: false,
    loading: true,
    evaluation: null as FlagEvaluation | null,
  };
}

// Newsletter-specific feature flag helpers
export async function shouldShowExitIntent(userId?: string, sessionId?: string): Promise<boolean> {
  const evaluation = await isFeatureEnabled(GROWTH_FLAGS.EXIT_INTENT_POPUP, userId, sessionId, {
    pageType: 'blog-post',
  });
  return evaluation.enabled;
}

export async function shouldUseModalNewsletter(
  userId?: string,
  sessionId?: string,
): Promise<boolean> {
  const evaluation = await isFeatureEnabled(
    GROWTH_FLAGS.NEWSLETTER_MODAL_TRIGGER,
    userId,
    sessionId,
  );
  return evaluation.enabled;
}

export async function shouldShowScrollTrigger(
  userId?: string,
  sessionId?: string,
  pageType?: string,
): Promise<boolean> {
  const evaluation = await isFeatureEnabled(
    GROWTH_FLAGS.SCROLL_TRIGGER_NEWSLETTER,
    userId,
    sessionId,
    { pageType },
  );
  return evaluation.enabled;
}

export async function shouldShowSocialProof(userId?: string, sessionId?: string): Promise<boolean> {
  const evaluation = await isFeatureEnabled(GROWTH_FLAGS.SOCIAL_PROOF_BADGES, userId, sessionId);
  return evaluation.enabled;
}

// Analytics integration for feature flag tracking
export async function trackFeatureFlagUsage(
  flagId: string,
  enabled: boolean,
  userId?: string,
  sessionId?: string,
  context?: Record<string, any>,
): Promise<void> {
  try {
    // This would integrate with your analytics system
    logger.info(
      {
        flagId,
        enabled,
        userId: userId?.substring(0, 8) + '...',
        sessionId: sessionId?.substring(0, 8) + '...',
        context,
      },
      'Feature flag usage tracked',
    );
  } catch (error) {
    logger.error({ error, flagId }, 'Failed to track feature flag usage');
  }
}
