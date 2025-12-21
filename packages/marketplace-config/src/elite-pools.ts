/**
 * Elite-tier pooled scraping configuration for Facebook Marketplace
 *
 * ARCHITECTURE:
 * - Pool-level scraping ONLY (no per-search, no savedSearchId polling)
 * - Declarative configuration consumed by existing pool scheduler
 * - Amortizes scraping cost across all Elite users in each pool
 *
 * COST ASSUMPTIONS:
 * - Average compute units (CU) per pool run: 1.2
 * - Apify CU cost: $0.30 USD
 * - Cost per run: ~$0.36 USD
 *
 * CADENCE RATIONALE:
 * - Phones: 15 min (900s) - High velocity, time-sensitive inventory
 * - Electronics: 30 min (1800s) - Slower turnover, stable listings
 *
 * BUDGET CAPS (worst-case Apify spend):
 * - Phones pools:
 *   - 5 runs/hour × 24 hours = 120 runs/day
 *   - 120 runs × 1.2 CU = 144 CU/day (capped at 120)
 *   - 120 CU × $0.30 = $36/day max
 *
 * - Electronics pools:
 *   - 3 runs/hour × 24 hours = 72 runs/day
 *   - 72 runs × 1.2 CU = 86.4 CU/day (capped at 60)
 *   - 60 CU × $0.30 = $18/day max
 */

export interface ElitePoolConfig {
  pool_id: string;
  marketplace: "facebook";
  region: "US" | "UK";
  category: "phones" | "electronics";
  cadence_seconds: number;
  budgets: {
    max_runs_per_hour: number;
    max_cu_per_day: number;
    max_usd_per_day: number;
  };
}

export const ELITE_POOLS: readonly ElitePoolConfig[] = [
  {
    pool_id: "fb_phones_us_elite",
    marketplace: "facebook",
    region: "US",
    category: "phones",
    cadence_seconds: 900, // 15 minutes - high-frequency for fast-moving phone inventory
    budgets: {
      max_runs_per_hour: 5,
      max_cu_per_day: 120,
      max_usd_per_day: 36,
    },
  },
  {
    pool_id: "fb_phones_uk_elite",
    marketplace: "facebook",
    region: "UK",
    category: "phones",
    cadence_seconds: 900, // 15 minutes - matches US cadence for consistency
    budgets: {
      max_runs_per_hour: 5,
      max_cu_per_day: 120,
      max_usd_per_day: 36,
    },
  },
  {
    pool_id: "fb_electronics_us_elite",
    marketplace: "facebook",
    region: "US",
    category: "electronics",
    cadence_seconds: 1800, // 30 minutes - MacBooks/iPads have slower turnover
    budgets: {
      max_runs_per_hour: 3,
      max_cu_per_day: 60,
      max_usd_per_day: 18,
    },
  },
  {
    pool_id: "fb_electronics_uk_elite",
    marketplace: "facebook",
    region: "UK",
    category: "electronics",
    cadence_seconds: 1800, // 30 minutes - premium tech items are less time-critical
    budgets: {
      max_runs_per_hour: 3,
      max_cu_per_day: 60,
      max_usd_per_day: 18,
    },
  },
] as const;
