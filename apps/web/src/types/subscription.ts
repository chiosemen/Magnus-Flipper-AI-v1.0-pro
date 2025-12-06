// apps/web/src/types/subscription.ts

export enum SubscriptionTier {
  FREE = "free",
  PRO = "pro",
  AGENCY = "agency",
  ADMIN = "admin",
}

export const TIER_HIERARCHY = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.PRO]: 1,
  [SubscriptionTier.AGENCY]: 2,
  [SubscriptionTier.ADMIN]: 3,
};

/**
 * Subscription metadata interface
 */
export interface SubscriptionMetadata {
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  limits: {
    searches?: number;
    alerts?: number;
    apiCalls?: number;
    teamMembers?: number;
  };
  stripePriceId?: string;
}

/**
 * Tier metadata configuration
 */
export const TIER_METADATA: Record<SubscriptionTier, SubscriptionMetadata> = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    currency: 'GBP',
    features: [
      'Basic search',
      'Limited alerts (5)',
      'Email notifications',
      'Basic analytics',
    ],
    limits: {
      searches: 10,
      alerts: 5,
    },
  },
  [SubscriptionTier.PRO]: {
    name: 'Pro',
    description: 'For serious flippers',
    price: 29,
    currency: 'GBP',
    features: [
      'Unlimited searches',
      'Unlimited alerts',
      'Advanced filters',
      'Profit calculator',
      'Priority support',
      'SMS notifications',
    ],
    limits: {
      searches: -1, // unlimited
      alerts: -1,
    },
    stripePriceId: undefined, // Will be set at runtime via getStripePriceId()
  },
  [SubscriptionTier.AGENCY]: {
    name: 'Agency',
    description: 'For teams and agencies',
    price: 149,
    currency: 'GBP',
    features: [
      'Everything in Pro',
      'Team management (5 members)',
      'API access',
      'White-label options',
      'Custom integrations',
      'Dedicated support',
    ],
    limits: {
      searches: -1,
      alerts: -1,
      teamMembers: 5,
      apiCalls: 100000,
    },
    stripePriceId: undefined, // Will be set at runtime via getStripePriceId()
  },
  [SubscriptionTier.ADMIN]: {
    name: 'Admin',
    description: 'Platform administration',
    price: 0,
    currency: 'GBP',
    features: [
      'Full platform access',
      'System management',
      'User management',
      'Analytics dashboard',
    ],
    limits: {},
  },
};

/**
 * Mock user type for development
 */
export interface MockUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
}

/**
 * User subscription interface
 */
export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
}
