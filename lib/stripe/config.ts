import Stripe from 'stripe';

// Stripe configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe Price IDs (these would be configured in Stripe Dashboard)
export const STRIPE_PRICES = {
  BASIC_MONTHLY: process.env.STRIPE_PRICE_BASIC_MONTHLY || 'price_basic_monthly',
  BASIC_YEARLY: process.env.STRIPE_PRICE_BASIC_YEARLY || 'price_basic_yearly',
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  ENTERPRISE_MONTHLY: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
  ENTERPRISE_YEARLY: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    description: 'Basic features for casual readers',
    features: [
      'Access to all free articles',
      'Basic commenting',
      'Newsletter subscription',
      'Dark mode',
    ],
    limits: {
      postsPerMonth: 0,
      apiCalls: 100,
      storage: 0,
    },
  },
  BASIC: {
    name: 'Basic',
    description: 'For regular readers and contributors',
    features: [
      'All Free features',
      'Access to premium articles',
      'Priority support',
      'Ad-free experience',
      'Early access to new features',
    ],
    prices: {
      monthly: STRIPE_PRICES.BASIC_MONTHLY,
      yearly: STRIPE_PRICES.BASIC_YEARLY,
    },
    limits: {
      postsPerMonth: 10,
      apiCalls: 1000,
      storage: 5, // GB
    },
  },
  PRO: {
    name: 'Pro',
    description: 'For power users and content creators',
    features: [
      'All Basic features',
      'Unlimited premium articles',
      'Advanced analytics',
      'Custom themes',
      'API access',
      'Export data',
    ],
    prices: {
      monthly: STRIPE_PRICES.PRO_MONTHLY,
      yearly: STRIPE_PRICES.PRO_YEARLY,
    },
    limits: {
      postsPerMonth: 100,
      apiCalls: 10000,
      storage: 50, // GB
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Custom solutions for organizations',
    features: [
      'All Pro features',
      'Unlimited everything',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'White-label options',
    ],
    prices: {
      monthly: STRIPE_PRICES.ENTERPRISE_MONTHLY,
      yearly: STRIPE_PRICES.ENTERPRISE_YEARLY,
    },
    limits: {
      postsPerMonth: -1, // Unlimited
      apiCalls: -1, // Unlimited
      storage: -1, // Unlimited
    },
  },
};

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
