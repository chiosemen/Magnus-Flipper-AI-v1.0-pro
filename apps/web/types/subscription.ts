/**
 * Subscription Types
 */

export type SubscriptionTier = "free" | "pro" | "premium" | "elite" | "ADMIN";

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: "active" | "cancelled" | "expired";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
}
