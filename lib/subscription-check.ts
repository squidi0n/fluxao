import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/stripe';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export async function getUserSubscription(userId?: string) {
  if (!userId) {
    const user = await getUserFromCookies();
    userId = user?.id;
  }

  if (!userId) {
    return {
      plan: 'FREE' as SubscriptionPlan,
      isActive: false,
      features: PLANS.FREE.limits,
    };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      trialEnd: true,
    },
  });

  if (!subscription) {
    return {
      plan: 'FREE' as SubscriptionPlan,
      isActive: false,
      features: PLANS.FREE.limits,
    };
  }

  const isActive =
    subscription.status === 'ACTIVE' ||
    subscription.status === 'TRIALING' ||
    (subscription.status === 'CANCELED' &&
      subscription.currentPeriodEnd &&
      new Date(subscription.currentPeriodEnd) > new Date());

  const plan = isActive ? subscription.plan : 'FREE';
  const features = PLANS[plan].limits;

  return {
    plan: plan as SubscriptionPlan,
    isActive,
    features,
    currentPeriodEnd: subscription.currentPeriodEnd,
    isTrialing: subscription.status === 'TRIALING',
    trialEnd: subscription.trialEnd,
  };
}

export async function checkFeatureAccess(
  feature: keyof typeof PLANS.FREE.limits,
  userId?: string,
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (feature === 'maxPosts') {
    return subscription.features.maxPosts === -1 || subscription.features.maxPosts > 0;
  }

  return subscription.features[feature] === true;
}

export async function requirePlan(
  requiredPlan: SubscriptionPlan,
  userId?: string,
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (requiredPlan === 'FREE') return true;
  if (requiredPlan === 'PRO') {
    return subscription.plan === 'PRO' || subscription.plan === 'ENTERPRISE';
  }
  if (requiredPlan === 'ENTERPRISE') {
    return subscription.plan === 'ENTERPRISE';
  }

  return false;
}
