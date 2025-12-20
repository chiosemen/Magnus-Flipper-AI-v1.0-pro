export type Region = "US" | "UK";

export type PricingTier = "FREE_BASIC" | "STARTER" | "PRO" | "ELITE";

export type DealCategory = "general" | "car";

export type AlertThresholds = {
  minScore: number;
  maxAgeMinutes: number;
};

export type HeatThresholds = {
  hot: { minScore: number; maxAgeMinutes: number };
  warm: { minScore: number; maxAgeMinutes: number };
};

export type FreshnessThresholds = {
  emphasizedMinutes: number;
  neutralMinutes: number;
};

export type ThresholdBundle = {
  region: Region;
  tier: PricingTier;
  category: DealCategory;
  alert: AlertThresholds;
  heat: HeatThresholds;
  freshness: FreshnessThresholds;
};

function normalizeRegion(input: unknown): Region {
  if (typeof input !== "string") return "US";
  const upper = input.trim().toUpperCase();
  if (upper === "UK" || upper === "GB") return "UK";
  if (upper === "US") return "US";
  return "US";
}

function normalizeTier(input: unknown): PricingTier {
  if (typeof input !== "string") return "FREE_BASIC";
  const value = input.trim().toLowerCase();
  if (!value) return "FREE_BASIC";

  if (value === "free" || value === "basic" || value === "free/basic" || value === "free_basic") {
    return "FREE_BASIC";
  }
  if (value === "starter") return "STARTER";
  if (value === "pro" || value === "premium") return "PRO";
  if (value === "elite" || value === "agency" || value === "ultra" || value === "admin") return "ELITE";

  if (value.includes("starter")) return "STARTER";
  if (value.includes("elite") || value.includes("agency") || value.includes("ultra")) return "ELITE";
  if (value.includes("pro") || value.includes("premium")) return "PRO";
  if (value.includes("free") || value.includes("basic")) return "FREE_BASIC";

  return "FREE_BASIC";
}

function normalizeCategory(input: unknown): DealCategory {
  if (typeof input !== "string") return "general";
  const value = input.trim().toLowerCase();
  if (value === "car" || value === "cars") return "car";
  return "general";
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Region-aware thresholds for alerts + heat + freshness visuals.
 *
 * Guardrails:
 * - UK markets move slightly slower:
 *   wider time windows and marginally lower score floors on paid tiers.
 * - FREE_BASIC remains strict in both regions (prevents noisy alerts).
 */
export function getAlertThresholds(regionInput: unknown, tierInput: unknown, categoryInput: unknown): ThresholdBundle {
  const region = normalizeRegion(regionInput);
  const tier = normalizeTier(tierInput);
  const category = normalizeCategory(categoryInput);

  // Base (US) tier thresholds.
  let alert: AlertThresholds;
  if (tier === "FREE_BASIC") alert = { minScore: 85, maxAgeMinutes: 30 };
  else if (tier === "STARTER") alert = { minScore: 80, maxAgeMinutes: 45 };
  else if (tier === "PRO") alert = { minScore: 75, maxAgeMinutes: 60 };
  else alert = { minScore: 70, maxAgeMinutes: 90 }; // ELITE

  // UK modifier (paid tiers only).
  if (region === "UK") {
    if (tier === "STARTER") {
      alert = { minScore: alert.minScore - 1, maxAgeMinutes: alert.maxAgeMinutes + 15 };
    } else if (tier === "PRO") {
      alert = { minScore: alert.minScore - 2, maxAgeMinutes: alert.maxAgeMinutes + 30 };
    } else if (tier === "ELITE") {
      // Example from spec: Elite US 70/<90m -> UK 68/<120m
      alert = { minScore: alert.minScore - 2, maxAgeMinutes: alert.maxAgeMinutes + 30 };
    }
  }

  // Heat thresholds are not tier-dependent, but are region-aware to keep visuals aligned with alert rules.
  const heat: HeatThresholds =
    region === "UK"
      ? {
          hot: { minScore: 83, maxAgeMinutes: 45 },
          warm: { minScore: 68, maxAgeMinutes: 180 },
        }
      : {
          hot: { minScore: 85, maxAgeMinutes: 30 },
          warm: { minScore: 70, maxAgeMinutes: 120 },
        };

  const freshness: FreshnessThresholds =
    region === "UK"
      ? { emphasizedMinutes: 20, neutralMinutes: 90 }
      : { emphasizedMinutes: 15, neutralMinutes: 60 };

  // Category placeholder (future): keep `category` in the contract without changing v1 behavior.
  void category;

  return {
    region,
    tier,
    category,
    alert: {
      minScore: clampScore(alert.minScore),
      maxAgeMinutes: Math.max(1, Math.floor(alert.maxAgeMinutes)),
    },
    heat,
    freshness,
  };
}

