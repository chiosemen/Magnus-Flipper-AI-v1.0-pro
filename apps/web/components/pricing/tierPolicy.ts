export type TierKey = "free" | "pro" | "agency";

export type TierPolicy = {
  tier: TierKey;
  maxQueriesPerRun: number;
  maxConcurrency: number;
  marketsAllowed: string[];
};

export const TIER_POLICY_MAP: Record<TierKey, TierPolicy> = {
  free: {
    tier: "free",
    maxQueriesPerRun: 2,
    maxConcurrency: 1,
    marketsAllowed: ["facebook", "vinted"],
  },
  pro: {
    tier: "pro",
    maxQueriesPerRun: 5,
    maxConcurrency: 3,
    marketsAllowed: ["facebook", "vinted"],
  },
  agency: {
    tier: "agency",
    maxQueriesPerRun: 10,
    maxConcurrency: 10,
    marketsAllowed: ["facebook", "vinted"],
  },
};
