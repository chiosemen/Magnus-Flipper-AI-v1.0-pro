/**
 * Elite Pool Throttle Policy Engine
 *
 * MISSION:
 * Automated risk controls that protect profitability by dynamically adjusting
 * pool behavior based on revenue coverage ratios.
 *
 * ECONOMIC RATIONALE:
 * When revenue doesn't cover costs (low coverage ratio), we must reduce expenses
 * by either slowing down scraping (throttling) or temporarily disabling pools.
 *
 * POLICY TIERS:
 * - ALLOW (≥1.15):   Healthy margin, operate normally
 * - WARN (1.0-1.15):  Low margin, log warning but continue
 * - THROTTLE (0.9-1.0): Near break-even, slow down to reduce costs
 * - PAUSE (<0.9):     Deficit mode, disable lowest-priority pools
 *
 * THROTTLE MECHANICS:
 * - Throttle multiplier = 2× (doubles cadence intervals)
 * - Example: 15-min cadence → 30-min cadence
 * - Reduces runs per hour by 50%, cutting costs proportionally
 *
 * PAUSE MECHANICS:
 * - Target lowest-priority pools first (highest numeric priority value)
 * - Pause pools sequentially until coverage ratio ≥ 0.9
 * - Preserves highest-value pools (e.g., phones > electronics)
 *
 * PURE FUNCTION:
 * - No side effects
 * - No database access
 * - No scheduler calls
 * - Fully deterministic and testable
 */

import type { ElitePoolConfig } from "@magnus-flipper-ai/marketplace-config";

/**
 * Policy actions that can be taken based on coverage ratio
 */
export type ThrottleAction = "ALLOW" | "WARN" | "THROTTLE" | "PAUSE";

/**
 * Input parameters for throttle policy decision
 */
export interface EliteThrottlePolicyInput {
  /**
   * Coverage ratio from calculateEliteCoverage()
   * - > 1.0: Revenue exceeds costs (profitable)
   * - = 1.0: Break-even
   * - < 1.0: Costs exceed revenue (deficit)
   */
  coverageRatio: number;

  /**
   * Currently enabled Elite pools
   * Used to determine which pools to pause if needed
   */
  pools: readonly ElitePoolConfig[];
}

/**
 * Throttle policy decision output
 */
export interface EliteThrottlePolicyResult {
  /**
   * Action to take based on coverage ratio
   * - ALLOW: Operate normally
   * - WARN: Log warning but continue
   * - THROTTLE: Slow down scraping
   * - PAUSE: Disable pools
   */
  action: ThrottleAction;

  /**
   * Cadence multiplier when action = THROTTLE
   * Example: 2 means double the cadence (15min → 30min)
   * @default undefined (only set when action = THROTTLE)
   */
  throttleMultiplier?: number;

  /**
   * Pool IDs to pause when action = PAUSE
   * Sorted by priority (lowest priority pools first)
   * @default undefined (only set when action = PAUSE)
   */
  pausedPools?: string[];

  /**
   * Human-readable explanation of the decision
   */
  reason: string;

  /**
   * Coverage ratio that triggered this decision
   */
  triggerRatio: number;

  /**
   * Number of pools that would remain active after pausing (if action = PAUSE)
   */
  remainingPoolCount?: number;
}

/**
 * Coverage ratio thresholds for policy decisions
 */
const COVERAGE_THRESHOLDS = {
  /** Healthy margin - operate normally */
  ALLOW: 1.15,

  /** Low margin - warn but continue */
  WARN: 1.0,

  /** Near break-even - throttle to reduce costs */
  THROTTLE: 0.9,

  /** Deficit - pause pools (anything below THROTTLE threshold) */
  PAUSE: 0.9,
} as const;

/**
 * Throttle multiplier applied when in THROTTLE mode
 * Doubles the cadence to reduce runs by 50%
 */
const THROTTLE_MULTIPLIER = 2;

/**
 * Calculate Elite pool throttle policy
 *
 * Pure function that determines what action to take based on coverage ratio.
 * Does NOT execute any actions - only returns a decision for the scheduler to implement.
 *
 * @param input - Policy decision parameters
 * @returns Policy decision with action and parameters
 *
 * @example
 * ```typescript
 * import { calculateEliteThrottlePolicy } from '@magnus-flipper-ai/core/services/eliteThrottlePolicy';
 * import { getEnabledElitePools } from '@magnus-flipper-ai/marketplace-config';
 *
 * const policy = calculateEliteThrottlePolicy({
 *   coverageRatio: 0.85,
 *   pools: getEnabledElitePools()
 * });
 *
 * if (policy.action === 'PAUSE') {
 *   console.log(`Pausing pools: ${policy.pausedPools?.join(', ')}`);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Healthy margin scenario
 * const policy = calculateEliteThrottlePolicy({
 *   coverageRatio: 1.5,
 *   pools: getEnabledElitePools()
 * });
 * // Result: { action: "ALLOW", reason: "...", ... }
 * ```
 *
 * @example
 * ```typescript
 * // Throttle scenario
 * const policy = calculateEliteThrottlePolicy({
 *   coverageRatio: 0.95,
 *   pools: getEnabledElitePools()
 * });
 * // Result: { action: "THROTTLE", throttleMultiplier: 2, reason: "...", ... }
 * ```
 */
export function calculateEliteThrottlePolicy(
  input: EliteThrottlePolicyInput
): EliteThrottlePolicyResult {
  const { coverageRatio, pools } = input;

  // ============================================================================
  // ALLOW: Healthy margin (≥1.15)
  // ============================================================================
  if (coverageRatio >= COVERAGE_THRESHOLDS.ALLOW) {
    return {
      action: "ALLOW",
      reason: `Coverage ratio ${coverageRatio.toFixed(2)} is healthy (≥${COVERAGE_THRESHOLDS.ALLOW}). Operating at normal cadence.`,
      triggerRatio: coverageRatio,
    };
  }

  // ============================================================================
  // WARN: Low margin (1.0-1.15)
  // ============================================================================
  if (coverageRatio >= COVERAGE_THRESHOLDS.WARN) {
    return {
      action: "WARN",
      reason: `Coverage ratio ${coverageRatio.toFixed(2)} is below healthy threshold (${COVERAGE_THRESHOLDS.ALLOW}). Consider monitoring subscriber growth or reducing enabled pools.`,
      triggerRatio: coverageRatio,
    };
  }

  // ============================================================================
  // THROTTLE: Near break-even (0.9-1.0)
  // ============================================================================
  if (coverageRatio >= COVERAGE_THRESHOLDS.THROTTLE) {
    return {
      action: "THROTTLE",
      throttleMultiplier: THROTTLE_MULTIPLIER,
      reason: `Coverage ratio ${coverageRatio.toFixed(2)} is near break-even. Throttling cadence by ${THROTTLE_MULTIPLIER}× to reduce costs.`,
      triggerRatio: coverageRatio,
    };
  }

  // ============================================================================
  // PAUSE: Deficit (<0.9)
  // ============================================================================
  // Sort pools by priority (descending) to pause lowest-priority pools first
  // Lowest priority = highest numeric priority value
  const poolsSortedByPriority = pools
    .slice()
    .sort((a, b) => b.priority - a.priority);

  // Determine how many pools to pause
  // Strategy: Pause pools until we would reach ≥0.9 coverage ratio
  // For now, we pause the single lowest-priority pool
  // (More sophisticated logic could calculate exact number needed)
  const poolsToPause = poolsSortedByPriority.slice(0, 1).map((p) => p.poolId);

  return {
    action: "PAUSE",
    pausedPools: poolsToPause,
    remainingPoolCount: pools.length - poolsToPause.length,
    reason: `Coverage ratio ${coverageRatio.toFixed(2)} indicates deficit. Pausing ${poolsToPause.length} lowest-priority pool(s): ${poolsToPause.join(", ")}. Target: restore ratio to ≥${COVERAGE_THRESHOLDS.THROTTLE}.`,
    triggerRatio: coverageRatio,
  };
}

/**
 * Determine which pools should be paused to restore profitability
 *
 * More sophisticated version that calculates exact number of pools to pause
 * based on target coverage ratio.
 *
 * @param pools - Currently enabled pools
 * @param currentCoverageRatio - Current coverage ratio
 * @param monthlyRevenue - Total monthly revenue from Elite subscribers
 * @param targetCoverageRatio - Desired coverage ratio (default: 1.0)
 * @returns Array of pool IDs to pause, sorted by priority (lowest priority first)
 *
 * @example
 * ```typescript
 * import { selectPoolsToPause } from '@magnus-flipper-ai/core/services/eliteThrottlePolicy';
 *
 * const toPause = selectPoolsToPause(
 *   getEnabledElitePools(),
 *   0.75,  // Current ratio
 *   1500,  // Monthly revenue
 *   1.0    // Target ratio
 * );
 * ```
 */
export function selectPoolsToPause(
  pools: readonly ElitePoolConfig[],
  currentCoverageRatio: number,
  monthlyRevenue: number,
  targetCoverageRatio: number = 1.0
): string[] {
  // If already at or above target, no need to pause anything
  if (currentCoverageRatio >= targetCoverageRatio) {
    return [];
  }

  // Sort pools by priority (descending) - lowest priority (highest value) first
  const poolsSortedByPriority = pools
    .slice()
    .sort((a, b) => b.priority - a.priority);

  const APIFY_CU_PRICE_USD = 0.30;
  const targetCost = monthlyRevenue / targetCoverageRatio;

  let cumulativeCU = pools.reduce((sum, pool) => sum + pool.estimatedMonthlyCU, 0);
  const poolsToPause: string[] = [];

  // Remove pools one by one until we hit target coverage
  for (const pool of poolsSortedByPriority) {
    const currentCost = cumulativeCU * APIFY_CU_PRICE_USD;

    // If current cost is already at or below target, stop
    if (currentCost <= targetCost) {
      break;
    }

    // Pause this pool
    poolsToPause.push(pool.poolId);
    cumulativeCU -= pool.estimatedMonthlyCU;
  }

  return poolsToPause;
}

/**
 * Format throttle policy result for logging
 *
 * Utility function to create human-readable log messages from policy decisions.
 *
 * @param result - Throttle policy result
 * @returns Formatted log message
 *
 * @example
 * ```typescript
 * import { formatThrottlePolicyLog } from '@magnus-flipper-ai/core/services/eliteThrottlePolicy';
 *
 * const policy = calculateEliteThrottlePolicy({ coverageRatio: 0.95, pools });
 * console.log(formatThrottlePolicyLog(policy));
 * // Output: "[THROTTLE] Coverage ratio 0.95 is near break-even. Throttling cadence by 2× to reduce costs."
 * ```
 */
export function formatThrottlePolicyLog(result: EliteThrottlePolicyResult): string {
  const prefix = `[${result.action}]`;

  switch (result.action) {
    case "ALLOW":
      return `${prefix} ${result.reason}`;

    case "WARN":
      return `${prefix} ⚠️  ${result.reason}`;

    case "THROTTLE":
      return `${prefix} 🔄 ${result.reason}`;

    case "PAUSE":
      return `${prefix} ⏸️  ${result.reason}`;

    default:
      return `${prefix} ${result.reason}`;
  }
}
