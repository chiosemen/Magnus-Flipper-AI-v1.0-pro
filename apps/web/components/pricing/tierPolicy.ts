export type TierKey = "free" | "pro" | "agency";

import { MARKETPLACES, type MarketplaceId } from "@/lib/marketplaceRegistry";

export type TierPolicy = {
  tier: TierKey;
  maxQueriesPerRun: number;
  maxConcurrency: number;
  marketsAllowed: MarketplaceId[];
};

function getTierMarkets(tier: TierKey): MarketplaceId[] {
  return Object.values(MARKETPLACES)
    .filter((market) => market.enabled && market.tierAccess[tier])
    .map((market) => market.id);
}

export const TIER_POLICY_MAP: Record<TierKey, TierPolicy> = {
  free: {
    tier: "free",
    maxQueriesPerRun: 2,
    maxConcurrency: 1,
    marketsAllowed: getTierMarkets("free"),
  },
  pro: {
    tier: "pro",
    maxQueriesPerRun: 5,
    maxConcurrency: 3,
    marketsAllowed: getTierMarkets("pro"),
  },
  agency: {
    tier: "agency",
    maxQueriesPerRun: 10,
    maxConcurrency: 10,
    marketsAllowed: getTierMarkets("agency"),
  },
};
