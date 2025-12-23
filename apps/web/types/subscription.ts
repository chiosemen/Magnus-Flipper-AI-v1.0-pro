/**
 * Subscription Types
 */

export type SubscriptionTier = "free" | "pro" | "premium" | "elite" | "ADMIN";

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
  elite: 3,
  ADMIN: 99,
};

export interface MockUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
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
