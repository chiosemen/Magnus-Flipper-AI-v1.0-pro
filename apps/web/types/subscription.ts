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

export const TIER_METADATA = {
  free: { name: "Free", price: "$0", features: ["Basic search", "Limited alerts"] },
  pro: { name: "Pro", price: "$29", features: ["Unlimited search", "Live feed", "Analytics"] },
  premium: { name: "Premium", price: "$49", features: ["All Pro features", "Priority support"] },
  elite: { name: "Elite", price: "$99", features: ["All Premium features", "Custom integrations", "Dedicated support"] },
  ADMIN: { name: "Admin", price: "N/A", features: ["Full system access"] },
};

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: "active" | "cancelled" | "expired";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
}
