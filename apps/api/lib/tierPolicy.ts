import { getAllowedMarketsForTier, type MarketplaceId, type MarketplaceTier } from "./marketplaceRegistry";

export type Tier = MarketplaceTier;

export type TierFeatures = {
  dealScore: boolean;
  dealScoreExplain: boolean;
  dealScoreContext: boolean;
  insights: boolean;
  signals: boolean;
  heatmap: boolean;
  arbitrageReadOnly: boolean;
};

export type TierPolicy = {
  tier: Tier;
  maxQueriesPerRun: number;
  maxMarketsPerRun: number;
  maxConcurrency: number;
  marketsAllowed: MarketplaceId[];
  dailyRunLimit?: number;
  dailyCuLimit: number;
  cuCapPerRun: number;
  features: TierFeatures;
};

const TIER_FEATURES: Record<Tier, TierFeatures> = {
  free: {
    dealScore: true,
    dealScoreExplain: false,
    dealScoreContext: false,
    insights: false,
    signals: false,
    heatmap: false,
    arbitrageReadOnly: false,
  },
  pro: {
    dealScore: true,
    dealScoreExplain: true,
    dealScoreContext: false,
    insights: true,
    signals: true,
    heatmap: false,
    arbitrageReadOnly: false,
  },
  agency: {
    dealScore: true,
    dealScoreExplain: true,
    dealScoreContext: true,
    insights: true,
    signals: true,
    heatmap: true,
    arbitrageReadOnly: true,
  },
  enterprise: {
    dealScore: true,
    dealScoreExplain: true,
    dealScoreContext: true,
    insights: true,
    signals: true,
    heatmap: true,
    arbitrageReadOnly: true,
  },
};

const TIER_LIMITS: Record<Tier, Omit<TierPolicy, "tier" | "marketsAllowed">> = {
  free: {
    maxQueriesPerRun: 2,
    maxMarketsPerRun: 2,
    maxConcurrency: 1,
    dailyRunLimit: 5,
    dailyCuLimit: 50,
    cuCapPerRun: 20,
    features: TIER_FEATURES.free,
  },
  pro: {
    maxQueriesPerRun: 5,
    maxMarketsPerRun: 4,
    maxConcurrency: 3,
    dailyRunLimit: 50,
    dailyCuLimit: 200,
    cuCapPerRun: 80,
    features: TIER_FEATURES.pro,
  },
  agency: {
    maxQueriesPerRun: 10,
    maxMarketsPerRun: 10,
    maxConcurrency: 10,
    dailyCuLimit: 800,
    cuCapPerRun: 250,
    features: TIER_FEATURES.agency,
  },
  enterprise: {
    maxQueriesPerRun: 10,
    maxMarketsPerRun: 10,
    maxConcurrency: 10,
    dailyCuLimit: 1500,
    cuCapPerRun: 400,
    features: TIER_FEATURES.enterprise,
  },
};

export const TIER_POLICIES: Record<Tier, TierPolicy> = (Object.keys(TIER_LIMITS) as Tier[]).reduce(
  (acc, tier) => {
    acc[tier] = {
      tier,
      ...TIER_LIMITS[tier],
      marketsAllowed: getAllowedMarketsForTier(tier),
    };
    return acc;
  },
  {} as Record<Tier, TierPolicy>,
);

export function getTierPolicy(tier: Tier): TierPolicy {
  return TIER_POLICIES[tier] ?? TIER_POLICIES.free;
}
