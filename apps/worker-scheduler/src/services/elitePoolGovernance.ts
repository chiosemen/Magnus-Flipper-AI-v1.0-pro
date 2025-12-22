/**
 * Elite Pool Economic Governance
 *
 * MISSION:
 * Enforce economic guardrails on Elite pool scheduling by calculating coverage
 * ratios and applying automated throttle policies.
 *
 * SAFETY INVARIANTS:
 * - NEVER schedule Elite pools when coverage ratio < 1.0 and no pools can be paused
 * - ALWAYS apply throttle policy decisions (PAUSE, THROTTLE, WARN, ALLOW)
 * - ALWAYS log economic decisions with structured data
 *
 * INTEGRATION POINT:
 * This runs BEFORE any Elite pool scheduling occurs, acting as a gatekeeper.
 */

import {
  calculateEliteCoverage,
  calculateEliteThrottlePolicy,
  formatThrottlePolicyLog,
  type EliteThrottlePolicyResult,
} from "@magnus-flipper-ai/core";
import {
  ELITE_POOLS,
  getEnabledElitePools,
  type ElitePoolConfig,
} from "@magnus-flipper-ai/marketplace-config";

/**
 * Elite pool with applied governance modifications
 */
export interface GovernedElitePool extends ElitePoolConfig {
  /**
   * Original cadence in minutes (before any throttling)
   */
  originalCadenceMinutes: number;

  /**
   * Effective cadence after throttle policy applied
   */
  effectiveCadenceMinutes: number;

  /**
   * Whether this pool should be skipped in scheduling
   */
  shouldSkip: boolean;

  /**
   * Reason for skip (if shouldSkip = true)
   */
  skipReason?: string;
}

/**
 * Result of Elite pool governance check
 */
export interface EliteGovernanceResult {
  /**
   * Governance decision: allow scheduling or block
   */
  allowed: boolean;

  /**
   * Throttle policy decision
   */
  policy: EliteThrottlePolicyResult;

  /**
   * Pools with governance applied
   */
  governedPools: GovernedElitePool[];

  /**
   * Coverage metrics
   */
  coverage: {
    monthlyRevenue: number;
    monthlyCost: number;
    coverageRatio: number;
    headroomUSD: number;
  };

  /**
   * Elite subscriber configuration
   */
  config: {
    subscriberCount: number;
    monthlyPrice: number;
  };

  /**
   * Human-readable reason (if blocked)
   */
  blockReason?: string;
}

/**
 * Fetch Elite subscriber count and price from environment variables
 *
 * TEMPORARY: This reads from env vars as a mock. In production, this should
 * query the database for actual subscriber counts and tier pricing.
 *
 * @returns Subscriber count and monthly price
 */
function getEliteSubscriberConfig(): { subscriberCount: number; monthlyPrice: number } {
  const subscriberCount = parseInt(process.env.ELITE_SUB_COUNT || "0", 10);
  const monthlyPrice = parseFloat(process.env.ELITE_PRICE || "29.99");

  if (isNaN(subscriberCount) || subscriberCount < 0) {
    console.warn(
      "[Elite Governance] Invalid ELITE_SUB_COUNT, defaulting to 0"
    );
    return { subscriberCount: 0, monthlyPrice };
  }

  if (isNaN(monthlyPrice) || monthlyPrice <= 0) {
    console.warn(
      "[Elite Governance] Invalid ELITE_PRICE, defaulting to 29.99"
    );
    return { subscriberCount, monthlyPrice: 29.99 };
  }

  return { subscriberCount, monthlyPrice };
}

/**
 * Apply Elite pool economic governance
 *
 * This function:
 * 1. Fetches Elite subscriber count and price
 * 2. Calculates revenue coverage ratio
 * 3. Applies throttle policy based on coverage
 * 4. Returns governed pools with modifications applied
 *
 * @returns Governance result with allowed/blocked decision
 * @throws Error if coverage < 1.0 and no pools can be paused (hard safety rule)
 */
export async function applyElitePoolGovernance(): Promise<EliteGovernanceResult> {
  const WORKER_ID = process.env.WORKER_ID || "worker-scheduler";

  console.log(`[${WORKER_ID}] 🛡️  Elite Pool Governance: Starting economic check...`);

  // Step 1: Get Elite subscriber configuration
  const subscriberConfig = getEliteSubscriberConfig();

  console.log(
    `[${WORKER_ID}] 📊 Elite Config: ${subscriberConfig.subscriberCount} subscribers @ $${subscriberConfig.monthlyPrice}/month`
  );

  // Step 2: Get enabled Elite pools
  const enabledPools = getEnabledElitePools();

  if (enabledPools.length === 0) {
    console.log(
      `[${WORKER_ID}] ⚠️  No Elite pools enabled. Governance check skipped.`
    );
    return {
      allowed: true,
      policy: {
        action: "ALLOW",
        reason: "No Elite pools enabled",
        triggerRatio: Infinity,
      },
      governedPools: [],
      coverage: {
        monthlyRevenue: 0,
        monthlyCost: 0,
        coverageRatio: Infinity,
        headroomUSD: 0,
      },
      config: subscriberConfig,
    };
  }

  console.log(
    `[${WORKER_ID}] 📋 Enabled Elite Pools: ${enabledPools.map((p) => p.poolId).join(", ")}`
  );

  // Step 3: Calculate coverage
  const coverage = calculateEliteCoverage({
    eliteSubscriberCount: subscriberConfig.subscriberCount,
    elitePrice: subscriberConfig.monthlyPrice,
    enabledPools,
  });

  console.log(
    `[${WORKER_ID}] 💰 Coverage Analysis:`
  );
  console.log(`[${WORKER_ID}]   Monthly Revenue: $${coverage.monthlyRevenue.toFixed(2)}`);
  console.log(`[${WORKER_ID}]   Monthly Cost:    $${coverage.monthlyCost.toFixed(2)}`);
  console.log(`[${WORKER_ID}]   Coverage Ratio:  ${coverage.coverageRatio.toFixed(2)}`);
  console.log(`[${WORKER_ID}]   Headroom:        $${coverage.headroomUSD.toFixed(2)}`);

  // Step 4: Determine throttle policy
  const policy = calculateEliteThrottlePolicy({
    coverageRatio: coverage.coverageRatio,
    pools: enabledPools,
  });

  console.log(`[${WORKER_ID}] 🎯 ${formatThrottlePolicyLog(policy)}`);

  // Step 5: Apply policy to pools
  const governedPools: GovernedElitePool[] = enabledPools.map((pool) => {
    let shouldSkip = false;
    let skipReason: string | undefined;
    let effectiveCadence = pool.cadenceMinutes;

    // PAUSE action: skip pools in pausedPools array
    if (policy.action === "PAUSE" && policy.pausedPools?.includes(pool.poolId)) {
      shouldSkip = true;
      skipReason = "Paused by throttle policy (coverage ratio < 0.9)";
    }

    // THROTTLE action: apply multiplier to all pools
    if (policy.action === "THROTTLE" && policy.throttleMultiplier) {
      effectiveCadence = pool.cadenceMinutes * policy.throttleMultiplier;
    }

    return {
      ...pool,
      originalCadenceMinutes: pool.cadenceMinutes,
      effectiveCadenceMinutes: effectiveCadence,
      shouldSkip,
      skipReason,
    };
  });

  // Log pool-level decisions
  governedPools.forEach((pool) => {
    if (pool.shouldSkip) {
      console.log(
        `[${WORKER_ID}]   ⏸️  SKIP: ${pool.poolId} - ${pool.skipReason}`
      );
    } else if (pool.effectiveCadenceMinutes !== pool.originalCadenceMinutes) {
      console.log(
        `[${WORKER_ID}]   🔄 THROTTLE: ${pool.poolId} - ${pool.originalCadenceMinutes}min → ${pool.effectiveCadenceMinutes}min`
      );
    } else {
      console.log(
        `[${WORKER_ID}]   ✅ ALLOW: ${pool.poolId} - ${pool.cadenceMinutes}min cadence`
      );
    }
  });

  // Step 6: Enforce hard safety rule
  // If coverage < 1.0 AND no pools can be paused → block execution
  const activePools = governedPools.filter((p) => !p.shouldSkip);
  if (coverage.coverageRatio < 1.0 && activePools.length === enabledPools.length) {
    // Coverage is below break-even and no pools were paused
    const errorMsg = `Elite pool execution blocked: insufficient coverage (${coverage.coverageRatio.toFixed(2)} < 1.0) with no pools available to pause. Current deficit: $${Math.abs(coverage.headroomUSD).toFixed(2)}/month. Need ${Math.ceil((coverage.monthlyCost - coverage.monthlyRevenue) / subscriberConfig.monthlyPrice)} more subscribers.`;

    console.error(`[${WORKER_ID}] 🚫 GOVERNANCE VIOLATION: ${errorMsg}`);

    throw new Error(errorMsg);
  }

  // Step 7: Return governance result
  return {
    allowed: true,
    policy,
    governedPools,
    coverage: {
      monthlyRevenue: coverage.monthlyRevenue,
      monthlyCost: coverage.monthlyCost,
      coverageRatio: coverage.coverageRatio,
      headroomUSD: coverage.headroomUSD,
    },
    config: subscriberConfig,
  };
}

/**
 * Check if an Elite pool should be scheduled based on governance
 *
 * Utility function to query governance results for a specific pool.
 *
 * @param poolId - Elite pool ID to check
 * @param governanceResult - Result from applyElitePoolGovernance()
 * @returns True if pool should be scheduled, false if skipped
 */
export function shouldScheduleElitePool(
  poolId: string,
  governanceResult: EliteGovernanceResult
): boolean {
  const pool = governanceResult.governedPools.find((p) => p.poolId === poolId);
  return pool ? !pool.shouldSkip : false;
}

/**
 * Get effective cadence for an Elite pool after governance
 *
 * @param poolId - Elite pool ID
 * @param governanceResult - Result from applyElitePoolGovernance()
 * @returns Effective cadence in minutes, or null if pool should be skipped
 */
export function getEffectiveEliteCadence(
  poolId: string,
  governanceResult: EliteGovernanceResult
): number | null {
  const pool = governanceResult.governedPools.find((p) => p.poolId === poolId);
  if (!pool || pool.shouldSkip) {
    return null;
  }
  return pool.effectiveCadenceMinutes;
}
