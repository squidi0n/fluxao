import { prisma } from '@/lib/prisma';

export interface TrialStatus {
  hasTrialAccess: boolean;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  hasUsedTrial: boolean;
}

/**
 * Check if user has active 7-day trial access
 */
export async function getUserTrialStatus(userId: string): Promise<TrialStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trialStartedAt: true,
      trialEndsAt: true,
      hasUsedTrial: true,
      role: true,
      subscription: {
        select: {
          status: true,
          plan: true,
        }
      }
    }
  });

  if (!user) {
    return {
      hasTrialAccess: false,
      isTrialActive: false,
      trialEndsAt: null,
      trialDaysRemaining: 0,
      hasUsedTrial: false,
    };
  }

  // Premium users and above don't need trial
  if (user.role === 'PREMIUM' || user.role === 'EDITOR' || user.role === 'ADMIN') {
    return {
      hasTrialAccess: true,
      isTrialActive: true,
      trialEndsAt: null,
      trialDaysRemaining: 999,
      hasUsedTrial: user.hasUsedTrial,
    };
  }

  // Active subscription provides access
  if (user.subscription?.status === 'ACTIVE' && user.subscription?.plan !== 'FREE') {
    return {
      hasTrialAccess: true,
      isTrialActive: true,
      trialEndsAt: null,
      trialDaysRemaining: 999,
      hasUsedTrial: user.hasUsedTrial,
    };
  }

  const now = new Date();
  const isTrialActive = user.trialEndsAt ? new Date(user.trialEndsAt) > now : false;
  const trialDaysRemaining = user.trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    hasTrialAccess: isTrialActive,
    isTrialActive,
    trialEndsAt: user.trialEndsAt,
    trialDaysRemaining,
    hasUsedTrial: user.hasUsedTrial,
  };
}

/**
 * Start 7-day trial for a new user
 */
export async function startTrial(userId: string): Promise<void> {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

  await prisma.user.update({
    where: { id: userId },
    data: {
      trialStartedAt: now,
      trialEndsAt: trialEnd,
      hasUsedTrial: true,
    }
  });
}

/**
 * Check if user can start a trial (new user, hasn't used trial)
 */
export async function canStartTrial(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      hasUsedTrial: true,
      role: true,
      subscription: {
        select: { status: true, plan: true }
      }
    }
  });

  if (!user) return false;
  
  // Don't need trial if already premium or higher
  if (user.role === 'PREMIUM' || user.role === 'EDITOR' || user.role === 'ADMIN') {
    return false;
  }

  // Don't need trial if has active subscription
  if (user.subscription?.status === 'ACTIVE' && user.subscription?.plan !== 'FREE') {
    return false;
  }

  return !user.hasUsedTrial;
}

/**
 * Auto-start trial for new users on first content access
 */
export async function autoStartTrialIfEligible(userId: string): Promise<TrialStatus> {
  const canStart = await canStartTrial(userId);
  
  if (canStart) {
    await startTrial(userId);
  }
  
  return getUserTrialStatus(userId);
}

/**
 * Check if content should be restricted for user
 * Returns true if content should be blurred/restricted
 */
export async function shouldRestrictContent(userId?: string): Promise<boolean> {
  if (!userId) return true; // Anonymous users are restricted
  
  const trialStatus = await getUserTrialStatus(userId);
  
  // Premium access = no restrictions
  if (trialStatus.hasTrialAccess && trialStatus.trialDaysRemaining > 7) {
    return false;
  }
  
  // Active trial = no restrictions
  if (trialStatus.isTrialActive) {
    return false;
  }
  
  // No trial access and no premium = restricted
  return true;
}

/**
 * Get content access level for user
 */
export async function getContentAccessLevel(userId?: string): Promise<'full' | 'trial' | 'restricted'> {
  if (!userId) return 'restricted';
  
  const trialStatus = await getUserTrialStatus(userId);
  
  // Premium users get full access
  if (trialStatus.hasTrialAccess && trialStatus.trialDaysRemaining > 7) {
    return 'full';
  }
  
  // Trial users get trial access
  if (trialStatus.isTrialActive) {
    return 'trial';
  }
  
  return 'restricted';
}