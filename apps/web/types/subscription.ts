export enum SubscriptionTier {
  FREE = "FREE",
  PRO = "PRO",
  AGENCY = "AGENCY",
  ADMIN = "ADMIN",
}

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.PRO]: 1,
  [SubscriptionTier.AGENCY]: 2,
  [SubscriptionTier.ADMIN]: 3,
};

export interface SubscriptionMetadata {
  tier: SubscriptionTier;
  displayName: string;
  priceMonthly: number;
  features: string[];
  searchLimit?: number;
}

export const TIER_METADATA: Record<SubscriptionTier, SubscriptionMetadata> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    displayName: "Free",
    priceMonthly: 0,
    searchLimit: 10,
    features: [
      "10 searches per month",
      "Basic dashboard",
      "Manual search only",
    ],
  },
  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    displayName: "Pro",
    priceMonthly: 29,
    features: [
      "Unlimited searches",
      "Live feed",
      "Advanced analytics",
      "Price alerts",
      "Export data",
    ],
  },
  [SubscriptionTier.AGENCY]: {
    tier: SubscriptionTier.AGENCY,
    displayName: "Agency",
    priceMonthly: 149,
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Multi-user access",
      "Team analytics",
      "Priority support",
      "White-label options",
    ],
  },
  [SubscriptionTier.ADMIN]: {
    tier: SubscriptionTier.ADMIN,
    displayName: "Admin",
    priceMonthly: 0,
    features: [
      "Full platform access",
      "User management",
      "System monitoring",
      "Analytics dashboard",
      "Scraper controls",
    ],
  },
};

export interface MockUser {
  id: string;
  email: string;
  name: string;
  tier: SubscriptionTier;
  createdAt: Date;
}
