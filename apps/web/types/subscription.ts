// apps/web/types/subscription.ts

export enum SubscriptionTier {
  FREE = "free",
  PRO = "pro",
  PREMIUM = "premium",
  ELITE = "elite",
  AGENCY = "agency",
  ADMIN = "admin",
}

export const TIER_HIERARCHY = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.PRO]: 1,
  [SubscriptionTier.PREMIUM]: 2,
  [SubscriptionTier.ELITE]: 3,
  [SubscriptionTier.AGENCY]: 4,
  [SubscriptionTier.ADMIN]: 5,
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

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: "active" | "cancelled" | "expired";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
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

/**
 * Mock user interface for authorization
 */
export interface MockUser {
  id: string;
  tier: SubscriptionTier;
}

/**
 * Tier metadata mapping
 */
export const TIER_METADATA: Record<SubscriptionTier, SubscriptionMetadata> = {
  [SubscriptionTier.FREE]: {
    name: "Free",
    description: "Basic features",
    price: 0,
    currency: "USD",
    features: [],
    limits: {},
  },
  [SubscriptionTier.PRO]: {
    name: "Pro",
    description: "Professional features",
    price: 29,
    currency: "USD",
    features: [],
    limits: {},
  },
  [SubscriptionTier.PREMIUM]: {
    name: "Premium",
    description: "Premium features",
    price: 99,
    currency: "USD",
    features: [],
    limits: {},
  },
  [SubscriptionTier.ELITE]: {
    name: "Elite",
    description: "Elite features",
    price: 299,
    currency: "USD",
    features: [],
    limits: {},
  },
  [SubscriptionTier.AGENCY]: {
    name: "Agency",
    description: "Agency features",
    price: 999,
    currency: "USD",
    features: [],
    limits: {},
  },
  [SubscriptionTier.ADMIN]: {
    name: "Admin",
    description: "Admin features",
    price: 0,
    currency: "USD",
    features: [],
    limits: {},
  },
};
