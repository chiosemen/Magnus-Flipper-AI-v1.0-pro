/**
 * Elite Pool Coverage Calculator
 *
 * ECONOMICS:
 * Elite pools are fixed-cost pooled intelligence feeds. The total monthly cost
 * is determined by which pools are enabled, NOT by subscriber count. Revenue
 * must cover these fixed costs to maintain profitability.
 *
 * COST MODEL:
 * - Each enabled pool has a fixed monthly CU (Compute Units) budget
 * - Pool costs are step-function: enabling a pool adds its full cost
 * - Total cost = sum(enabled_pool.estimatedMonthlyCU) × CU_PRICE
 *
 * REVENUE MODEL:
 * - Revenue = subscriber_count × monthly_price
 * - Revenue scales linearly with subscribers
 *
 * COVERAGE RATIO:
 * - Ratio = revenue / cost
 * - Ratio > 1.0: Profitable (revenue exceeds costs)
 * - Ratio < 1.0: Unprofitable (costs exceed revenue)
 * - Ratio = 1.0: Break-even
 *
 * HEADROOM:
 * - Headroom = revenue - cost (in USD)
 * - Positive headroom: Profit margin
 * - Negative headroom: Deficit requiring subsidy
 *
 * PURE FUNCTION:
 * - No side effects
 * - No database access
 * - Fully deterministic
 * - Unit-testable
 */

import type { ElitePoolConfig } from "@magnus-flipper-ai/marketplace-config";

/**
 * Apify pricing constant (USD per compute unit)
 * Source: https://apify.com/pricing
 */
const APIFY_CU_PRICE_USD = 0.30;

/**
 * Input parameters for Elite coverage calculation
 */
export interface EliteCoverageInput {
  /**
   * Number of active Elite tier subscribers
   */
  eliteSubscriberCount: number;

  /**
   * Monthly subscription price per Elite subscriber (USD)
   */
  elitePrice: number;

  /**
   * Array of enabled Elite pools (typically from getEnabledElitePools())
   */
  enabledPools: readonly ElitePoolConfig[];
}

/**
 * Elite coverage calculation results
 */
export interface EliteCoverageResult {
  /**
   * Total monthly revenue from Elite subscribers (USD)
   * Formula: eliteSubscriberCount × elitePrice
   */
  monthlyRevenue: number;

  /**
   * Total monthly cost of all enabled pools (USD)
   * Formula: sum(pool.estimatedMonthlyCU) × APIFY_CU_PRICE_USD
   */
  monthlyCost: number;

  /**
   * Coverage ratio (revenue / cost)
   * - > 1.0: Profitable
   * - = 1.0: Break-even
   * - < 1.0: Unprofitable
   * - Infinity: No costs (all pools disabled or no pools)
   */
  coverageRatio: number;

  /**
   * Headroom in USD (revenue - cost)
   * - Positive: Profit margin
   * - Zero: Break-even
   * - Negative: Deficit
   */
  headroomUSD: number;

  /**
   * Total monthly compute units consumed by all enabled pools
   */
  totalMonthlyCU: number;

  /**
   * Number of enabled pools factored into cost calculation
   */
  enabledPoolCount: number;
}

/**
 * Calculate Elite pool economic coverage
 *
 * Pure function that determines if Elite tier revenue can cover the fixed costs
 * of running enabled pools.
 *
 * @param input - Coverage calculation parameters
 * @returns Coverage metrics and economic indicators
 *
 * @example
 * ```typescript
 * import { calculateEliteCoverage } from '@magnus-flipper-ai/core/services/eliteCoverage';
 * import { getEnabledElitePools } from '@magnus-flipper-ai/marketplace-config';
 *
 * const coverage = calculateEliteCoverage({
 *   eliteSubscriberCount: 100,
 *   elitePrice: 29.99,
 *   enabledPools: getEnabledElitePools()
 * });
 *
 * if (coverage.coverageRatio < 1.0) {
 *   console.warn(`Deficit: ${coverage.headroomUSD} USD/month`);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Zero subscribers (launch scenario)
 * const coverage = calculateEliteCoverage({
 *   eliteSubscriberCount: 0,
 *   elitePrice: 29.99,
 *   enabledPools: [ELITE_POOLS.fb_phones_us_elite]
 * });
 * // Result: { coverageRatio: 0, headroomUSD: -1036.80, ... }
 * ```
 *
 * @example
 * ```typescript
 * // No pools enabled (cost = 0)
 * const coverage = calculateEliteCoverage({
 *   eliteSubscriberCount: 50,
 *   elitePrice: 29.99,
 *   enabledPools: []
 * });
 * // Result: { coverageRatio: Infinity, headroomUSD: 1499.50, ... }
 * ```
 */
export function calculateEliteCoverage(
  input: EliteCoverageInput
): EliteCoverageResult {
  const { eliteSubscriberCount, elitePrice, enabledPools } = input;

  // Revenue calculation (scales with subscribers)
  const monthlyRevenue = eliteSubscriberCount * elitePrice;

  // Cost calculation (fixed, based on enabled pools)
  const totalMonthlyCU = enabledPools.reduce(
    (sum, pool) => sum + pool.estimatedMonthlyCU,
    0
  );
  const monthlyCost = totalMonthlyCU * APIFY_CU_PRICE_USD;

  // Coverage metrics
  const coverageRatio = monthlyCost === 0 ? Infinity : monthlyRevenue / monthlyCost;
  const headroomUSD = monthlyRevenue - monthlyCost;

  return {
    monthlyRevenue,
    monthlyCost,
    coverageRatio,
    headroomUSD,
    totalMonthlyCU,
    enabledPoolCount: enabledPools.length,
  };
}

/**
 * Minimum subscriber count needed to achieve break-even (coverage ratio = 1.0)
 *
 * Pure function that calculates the subscriber threshold for profitability.
 *
 * @param elitePrice - Monthly subscription price per Elite subscriber (USD)
 * @param enabledPools - Array of enabled Elite pools
 * @returns Minimum subscribers needed for break-even (rounded up to nearest integer)
 *
 * @example
 * ```typescript
 * import { calculateBreakEvenSubscribers } from '@magnus-flipper-ai/core/services/eliteCoverage';
 * import { ELITE_POOLS } from '@magnus-flipper-ai/marketplace-config';
 *
 * const minSubscribers = calculateBreakEvenSubscribers(
 *   29.99,
 *   [ELITE_POOLS.fb_phones_us_elite, ELITE_POOLS.fb_electronics_us_elite]
 * );
 * // Result: 52 subscribers needed for break-even
 * ```
 */
export function calculateBreakEvenSubscribers(
  elitePrice: number,
  enabledPools: readonly ElitePoolConfig[]
): number {
  if (elitePrice <= 0) {
    throw new Error("Elite price must be greater than 0");
  }

  const totalMonthlyCU = enabledPools.reduce(
    (sum, pool) => sum + pool.estimatedMonthlyCU,
    0
  );
  const monthlyCost = totalMonthlyCU * APIFY_CU_PRICE_USD;

  // No pools enabled = 0 subscribers needed
  if (monthlyCost === 0) {
    return 0;
  }

  // Calculate minimum subscribers (round up to ensure profitability)
  return Math.ceil(monthlyCost / elitePrice);
}

/**
 * Calculate maximum number of pools that can be enabled for a given subscriber count
 *
 * Pure function that determines pool capacity based on revenue constraints.
 * Assumes pools are sorted by priority (lower priority value = higher importance).
 *
 * @param eliteSubscriberCount - Number of active Elite subscribers
 * @param elitePrice - Monthly subscription price per Elite subscriber (USD)
 * @param availablePools - Array of pools sorted by priority (ascending)
 * @returns Number of pools that can be enabled while maintaining profitability
 *
 * @example
 * ```typescript
 * import { calculateMaxAffordablePools } from '@magnus-flipper-ai/core/services/eliteCoverage';
 * import { getAllElitePools } from '@magnus-flipper-ai/marketplace-config';
 *
 * const pools = getAllElitePools().sort((a, b) => a.priority - b.priority);
 * const maxPools = calculateMaxAffordablePools(75, 29.99, pools);
 * // Result: 2 (can afford top 2 priority pools)
 * ```
 */
export function calculateMaxAffordablePools(
  eliteSubscriberCount: number,
  elitePrice: number,
  availablePools: readonly ElitePoolConfig[]
): number {
  const monthlyRevenue = eliteSubscriberCount * elitePrice;
  let cumulativeCost = 0;
  let affordableCount = 0;

  for (const pool of availablePools) {
    const poolCost = pool.estimatedMonthlyCU * APIFY_CU_PRICE_USD;
    const projectedCost = cumulativeCost + poolCost;

    if (projectedCost <= monthlyRevenue) {
      cumulativeCost = projectedCost;
      affordableCount++;
    } else {
      // Can't afford this pool or any lower priority pools
      break;
    }
  }

  return affordableCount;
}
