export type TierKey = "free" | "pro" | "agency" | "enterprise";

import { MARKETPLACES, type MarketplaceId } from "@/lib/marketplaceRegistry";

export type TierPolicy = {
  tier: TierKey;
  maxQueriesPerRun: number;
  maxConcurrency: number;
  marketsAllowed: MarketplaceId[];
  features: {
    dealScore: boolean;
    dealScoreExplain: boolean;
    dealScoreContext: boolean;
    insights: boolean;
    signals: boolean;
    heatmap: boolean;
    arbitrageReadOnly: boolean;
  };
  featureHighlights: string[];
};

function getTierMarkets(tier: TierKey): MarketplaceId[] {
  return Object.values(MARKETPLACES)
    .filter((market) => {
      if (!market.enabled) return false;
      if (tier === "enterprise") return market.tierAvailability.agency;
      return market.tierAvailability[tier];
    })
    .map((market) => market.id);
}

export const TIER_POLICY_MAP: Record<TierKey, TierPolicy> = {
  free: {
    tier: "free",
    maxQueriesPerRun: 2,
    maxConcurrency: 1,
    marketsAllowed: getTierMarkets("free"),
    features: {
      dealScore: true,
      dealScoreExplain: false,
      dealScoreContext: false,
      insights: false,
      signals: false,
      heatmap: false,
      arbitrageReadOnly: false,
    },
    featureHighlights: [
      "Basic search access",
      "Limited parallel scans",
      "Deal Score (summary only)",
    ],
  },
  pro: {
    tier: "pro",
    maxQueriesPerRun: 5,
    maxConcurrency: 3,
    marketsAllowed: getTierMarkets("pro"),
    features: {
      dealScore: true,
      dealScoreExplain: true,
      dealScoreContext: false,
      insights: true,
      signals: true,
      heatmap: false,
      arbitrageReadOnly: false,
    },
    featureHighlights: [
      "Deal Score + explanations",
      "Signals and insights access",
      "Higher throughput caps",
    ],
  },
  agency: {
    tier: "agency",
    maxQueriesPerRun: 10,
    maxConcurrency: 10,
    marketsAllowed: getTierMarkets("agency"),
    features: {
      dealScore: true,
      dealScoreExplain: true,
      dealScoreContext: true,
      insights: true,
      signals: true,
      heatmap: true,
      arbitrageReadOnly: true,
    },
    featureHighlights: [
      "Full Deal Score + context",
      "Heatmap access",
      "Arbitrage signals (read-only)",
    ],
  },
  enterprise: {
    tier: "enterprise",
    maxQueriesPerRun: 10,
    maxConcurrency: 10,
    marketsAllowed: getTierMarkets("enterprise"),
    features: {
      dealScore: true,
      dealScoreExplain: true,
      dealScoreContext: true,
      insights: true,
      signals: true,
      heatmap: true,
      arbitrageReadOnly: true,
    },
    featureHighlights: [
      "Full Deal Score + context",
      "Heatmap access",
      "Arbitrage signals (read-only)",
    ],
  },
};
