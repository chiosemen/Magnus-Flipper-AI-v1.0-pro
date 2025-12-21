/**
 * Elite Pool Configuration
 *
 * Elite pools are fixed-cost pooled intelligence feeds. Costs are step-function, not per-user.
 *
 * Each pool represents a dedicated, automated scraping job that runs at a fixed cadence
 * regardless of how many users subscribe. The total cost is constant and amortized across
 * all Elite subscribers in that pool.
 *
 * ARCHITECTURE:
 * - Pool-level intelligence only (no per-user scraping)
 * - Fixed monthly compute budget per pool
 * - Priority-based resource allocation
 * - Explicit enable/disable controls for cost management
 *
 * COST MODEL:
 * - Monthly CU (Compute Units) budget is pre-calculated per pool
 * - Costs do NOT scale with user count (step-function economics)
 * - Total Elite tier cost = sum of enabled pool costs
 */

import type { MarketplaceId } from "./types";

/**
 * Strongly-typed Elite Pool configuration
 */
export interface ElitePoolConfig {
  /** Unique pool identifier (e.g., "fb_phones_us_elite") */
  poolId: string;

  /** Target marketplace */
  marketplace: MarketplaceId;

  /** Geographic region (ISO codes or common abbreviations) */
  region: string;

  /** Scraping cadence in minutes */
  cadenceMinutes: number;

  /** Estimated monthly Compute Units (CU) consumption */
  estimatedMonthlyCU: number;

  /**
   * Pool priority (lower = more important)
   * Used for resource allocation when multiple pools compete
   */
  priority: number;

  /**
   * Pool enabled state
   * @default false - pools must be explicitly enabled to avoid surprise costs
   */
  enabled: boolean;
}

/**
 * Elite Pool Registry
 *
 * IMPORTANT: All pools default to `enabled: false` to prevent accidental cost overruns.
 * Enable pools deliberately after confirming budget allocation.
 *
 * PRIORITY LEVELS:
 * - 1: Critical (highest value, time-sensitive inventory like phones)
 * - 2: High (premium electronics, fast-moving categories)
 * - 3: Medium (standard categories)
 * - 4+: Low (experimental or low-demand pools)
 */
export const ELITE_POOLS = {
  // ============================================================================
  // FACEBOOK MARKETPLACE - PHONES (High Priority)
  // ============================================================================
  fb_phones_us_elite: {
    poolId: "fb_phones_us_elite",
    marketplace: "facebook" as const,
    region: "US",
    cadenceMinutes: 15,
    estimatedMonthlyCU: 3456, // (24h × 60m / 15m) × 30 days × 1.2 CU/run = 3,456 CU
    priority: 1,
    enabled: false,
  },

  fb_phones_uk_elite: {
    poolId: "fb_phones_uk_elite",
    marketplace: "facebook" as const,
    region: "UK",
    cadenceMinutes: 15,
    estimatedMonthlyCU: 3456,
    priority: 1,
    enabled: false,
  },

  // ============================================================================
  // FACEBOOK MARKETPLACE - ELECTRONICS (Medium-High Priority)
  // ============================================================================
  fb_electronics_us_elite: {
    poolId: "fb_electronics_us_elite",
    marketplace: "facebook" as const,
    region: "US",
    cadenceMinutes: 30,
    estimatedMonthlyCU: 1728, // (24h × 60m / 30m) × 30 days × 1.2 CU/run = 1,728 CU
    priority: 2,
    enabled: false,
  },

  fb_electronics_uk_elite: {
    poolId: "fb_electronics_uk_elite",
    marketplace: "facebook" as const,
    region: "UK",
    cadenceMinutes: 30,
    estimatedMonthlyCU: 1728,
    priority: 2,
    enabled: false,
  },

  // ============================================================================
  // FUTURE POOLS (Example configurations)
  // ============================================================================
  // Uncomment and configure as needed:
  //
  // craigslist_cars_us_elite: {
  //   poolId: "craigslist_cars_us_elite",
  //   marketplace: "craigslist" as const,
  //   region: "US",
  //   cadenceMinutes: 60,
  //   estimatedMonthlyCU: 864,
  //   priority: 3,
  //   enabled: false,
  // },
} as const;

/**
 * Type-safe pool ID union (auto-derived from config keys)
 */
export type ElitePoolId = keyof typeof ELITE_POOLS;

/**
 * Helper: Get all pool configurations as an array
 */
export const getAllElitePools = (): readonly ElitePoolConfig[] => {
  return Object.values(ELITE_POOLS);
};

/**
 * Helper: Get only enabled pools
 */
export const getEnabledElitePools = (): ElitePoolConfig[] => {
  return Object.values(ELITE_POOLS).filter((pool) => pool.enabled);
};

/**
 * Helper: Calculate total monthly CU cost across all enabled pools
 */
export const calculateTotalMonthlyCU = (): number => {
  return Object.values(ELITE_POOLS)
    .filter((pool) => pool.enabled)
    .reduce((total, pool) => total + pool.estimatedMonthlyCU, 0);
};
