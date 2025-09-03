import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get monthly token limit from settings
 */
export async function getMonthlyTokenLimit(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'ai_tokens_monthly_cap' },
  });

  // Default: 100,000 tokens per month
  return setting ? parseInt(setting.value, 10) : 100000;
}

/**
 * Check if AI features are enabled
 */
export async function isAIEnabled(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'ai_enabled' },
  });

  return setting?.value === 'true';
}

/**
 * Get current month's usage
 */
export async function getCurrentUsage(): Promise<number> {
  const month = getCurrentMonth();

  const usage = await prisma.aiUsage.findUnique({
    where: { month },
  });

  return usage?.tokensUsed || 0;
}

/**
 * Check if budget allows for token usage without incrementing
 */
export async function checkBudget(
  estimatedTokens: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const month = getCurrentMonth();

  // Check if AI is enabled
  const aiEnabled = await isAIEnabled();
  if (!aiEnabled) {
    logger.warn('AI features are disabled');
    return { allowed: false, remaining: 0 };
  }

  // Get limit and current usage
  const limit = await getMonthlyTokenLimit();
  const currentUsage = await getCurrentUsage();
  const wouldBeUsage = currentUsage + estimatedTokens;

  // Check if would exceed limit
  if (wouldBeUsage > limit) {
    logger.warn(
      {
        currentUsage,
        estimatedTokens,
        limit,
        month,
      },
      'Would exceed monthly token limit',
    );

    return {
      allowed: false,
      remaining: Math.max(0, limit - currentUsage),
    };
  }

  return {
    allowed: true,
    remaining: limit - wouldBeUsage,
  };
}

/**
 * Check and increment token usage
 */
export async function checkAndIncrementTokens(
  estimatedTokens: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const month = getCurrentMonth();

  // Check if AI is enabled
  const aiEnabled = await isAIEnabled();
  if (!aiEnabled) {
    logger.warn('AI features are disabled');
    return { allowed: false, remaining: 0 };
  }

  // Get limit and current usage
  const limit = await getMonthlyTokenLimit();
  const usage = await prisma.aiUsage.upsert({
    where: { month },
    create: {
      month,
      tokensUsed: 0,
    },
    update: {},
  });

  const currentUsage = usage.tokensUsed;
  const wouldBeUsage = currentUsage + estimatedTokens;

  // Check if would exceed limit
  if (wouldBeUsage > limit) {
    logger.warn(
      {
        currentUsage,
        estimatedTokens,
        limit,
        month,
      },
      'Would exceed monthly token limit',
    );

    return {
      allowed: false,
      remaining: Math.max(0, limit - currentUsage),
    };
  }

  // Increment usage
  await prisma.aiUsage.update({
    where: { month },
    data: {
      tokensUsed: { increment: estimatedTokens },
    },
  });

  logger.info(
    {
      month,
      tokensUsed: estimatedTokens,
      totalUsage: wouldBeUsage,
      limit,
    },
    'AI tokens consumed',
  );

  return {
    allowed: true,
    remaining: limit - wouldBeUsage,
  };
}

/**
 * Record token usage (for after successful API calls)
 */
export async function recordUsage(tokensUsed: number): Promise<void> {
  const month = getCurrentMonth();

  await prisma.aiUsage.upsert({
    where: { month },
    create: {
      month,
      tokensUsed,
    },
    update: {
      tokensUsed: { increment: tokensUsed },
    },
  });

  logger.info(
    {
      month,
      tokensUsed,
    },
    'AI tokens recorded',
  );
}

/**
 * Get usage statistics
 */
export async function getUsageStats() {
  const month = getCurrentMonth();
  const limit = await getMonthlyTokenLimit();
  const currentUsage = await getCurrentUsage();

  const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;

  return {
    month,
    used: currentUsage,
    limit,
    remaining: Math.max(0, limit - currentUsage),
    percentage: Math.round(percentage),
  };
}

/**
 * Reset monthly usage (for testing or manual reset)
 */
export async function resetMonthlyUsage(month?: string): Promise<void> {
  const targetMonth = month || getCurrentMonth();

  await prisma.aiUsage.upsert({
    where: { month: targetMonth },
    create: {
      month: targetMonth,
      tokensUsed: 0,
    },
    update: {
      tokensUsed: 0,
    },
  });

  logger.info({ month: targetMonth }, 'Monthly AI usage reset');
}

/**
 * Initialize AI settings with defaults
 */
export async function initializeAISettings(): Promise<void> {
  const settings = [
    { key: 'ai_enabled', value: 'true' },
    { key: 'ai_tokens_monthly_cap', value: '100000' },
    { key: 'ai_autotag_enabled', value: 'true' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      create: setting,
      update: {},
    });
  }

  logger.info('AI settings initialized');
}
