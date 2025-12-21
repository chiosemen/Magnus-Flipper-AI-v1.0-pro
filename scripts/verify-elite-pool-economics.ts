#!/usr/bin/env tsx
/**
 * CI Enforcement: Elite Pool Economics Verification
 *
 * MISSION:
 * Block merges that introduce economic violations in Elite pool configuration.
 *
 * CHECKS:
 * 1. All pools must declare estimatedMonthlyCU (no missing costs)
 * 2. No pool can be enabled without a valid cost
 * 3. Total enabled pool cost must not exceed revenue from MIN_ELITE_SUBS
 *
 * EXIT CODES:
 * - 0: All checks passed
 * - 1: One or more violations detected (blocks merge)
 *
 * USAGE:
 * - Local: pnpm tsx scripts/verify-elite-pool-economics.ts
 * - CI: Runs automatically in verify-architecture workflow
 */

import {
  ELITE_POOLS,
  getAllElitePools,
  getEnabledElitePools,
  calculateTotalMonthlyCU,
  type ElitePoolConfig,
} from '../packages/marketplace-config/dist/elitePools.js';
import { calculateEliteCoverage } from '../packages/core/dist/services/eliteCoverage.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Minimum Elite subscribers threshold for cost coverage calculations
 * This represents the minimum subscriber base required before enabling pools.
 *
 * Default: 0 (allows pools to be enabled from day 1, but will warn about deficit)
 * Recommended: 50-100 for safer margins
 */
const MIN_ELITE_SUBS = parseInt(process.env.MIN_ELITE_SUBS || '0', 10);

/**
 * Elite tier monthly price (USD)
 * Used for revenue calculations
 */
const ELITE_PRICE = parseFloat(process.env.ELITE_PRICE || '29.99');

/**
 * Apify CU price (USD per compute unit)
 */
const APIFY_CU_PRICE_USD = 0.30;

// ============================================================================
// VERIFICATION CHECKS
// ============================================================================

interface ViolationResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
}

/**
 * Check 1: All pools must declare estimatedMonthlyCU
 */
function checkAllPoolsHaveCost(): ViolationResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  const allPools = getAllElitePools();

  console.log(`\n📋 Check 1: All pools declare estimatedMonthlyCU`);
  console.log(`   Total pools: ${allPools.length}`);

  for (const pool of allPools) {
    // Check if estimatedMonthlyCU exists and is a valid number
    if (
      pool.estimatedMonthlyCU === undefined ||
      pool.estimatedMonthlyCU === null ||
      isNaN(pool.estimatedMonthlyCU)
    ) {
      violations.push(
        `Pool "${pool.poolId}" is missing estimatedMonthlyCU or has invalid value`
      );
    } else if (pool.estimatedMonthlyCU <= 0) {
      violations.push(
        `Pool "${pool.poolId}" has estimatedMonthlyCU = ${pool.estimatedMonthlyCU} (must be > 0)`
      );
    } else {
      // Valid cost
      console.log(
        `   ✅ ${pool.poolId}: ${pool.estimatedMonthlyCU} CU/month ($${(pool.estimatedMonthlyCU * APIFY_CU_PRICE_USD).toFixed(2)}/month)`
      );
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Check 2: No pool can be enabled without valid cost
 */
function checkEnabledPoolsHaveValidCost(): ViolationResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  const enabledPools = getEnabledElitePools();

  console.log(`\n📋 Check 2: Enabled pools have valid costs`);
  console.log(`   Enabled pools: ${enabledPools.length}`);

  if (enabledPools.length === 0) {
    warnings.push('No Elite pools are enabled (safe but may be intentional)');
    console.log(`   ⚠️  WARNING: No pools enabled`);
  }

  for (const pool of enabledPools) {
    if (!pool.estimatedMonthlyCU || pool.estimatedMonthlyCU <= 0) {
      violations.push(
        `Enabled pool "${pool.poolId}" has invalid cost (${pool.estimatedMonthlyCU}). Cannot enable pool without valid estimatedMonthlyCU.`
      );
    } else {
      console.log(
        `   ✅ ${pool.poolId}: enabled with ${pool.estimatedMonthlyCU} CU/month`
      );
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Check 3: Total enabled pool cost must not exceed revenue from MIN_ELITE_SUBS
 */
function checkCostCoverage(): ViolationResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  const enabledPools = getEnabledElitePools();

  console.log(`\n📋 Check 3: Cost coverage with MIN_ELITE_SUBS=${MIN_ELITE_SUBS}`);

  if (enabledPools.length === 0) {
    console.log(`   ✅ No enabled pools - cost coverage check skipped`);
    return { passed: true, violations, warnings };
  }

  // Calculate coverage
  const coverage = calculateEliteCoverage({
    eliteSubscriberCount: MIN_ELITE_SUBS,
    elitePrice: ELITE_PRICE,
    enabledPools,
  });

  console.log(`   Monthly Revenue (${MIN_ELITE_SUBS} subs @ $${ELITE_PRICE}): $${coverage.monthlyRevenue.toFixed(2)}`);
  console.log(`   Monthly Cost (${coverage.enabledPoolCount} pools):          $${coverage.monthlyCost.toFixed(2)}`);
  console.log(`   Coverage Ratio:                                ${coverage.coverageRatio.toFixed(2)}`);
  console.log(`   Headroom:                                      $${coverage.headroomUSD.toFixed(2)}`);

  // Hard rule: If MIN_ELITE_SUBS > 0 and coverage < 1.0, it's a violation
  if (MIN_ELITE_SUBS > 0 && coverage.coverageRatio < 1.0) {
    violations.push(
      `Cost coverage violation: With ${MIN_ELITE_SUBS} subscribers, coverage ratio is ${coverage.coverageRatio.toFixed(2)} (< 1.0). ` +
      `Deficit: $${Math.abs(coverage.headroomUSD).toFixed(2)}/month. ` +
      `Either disable pools or increase MIN_ELITE_SUBS to at least ${Math.ceil(coverage.monthlyCost / ELITE_PRICE)} subscribers.`
    );
  } else if (MIN_ELITE_SUBS === 0 && coverage.coverageRatio < 1.0) {
    // MIN_ELITE_SUBS = 0 is allowed but warn about needing subscribers
    warnings.push(
      `MIN_ELITE_SUBS=0: Pools are enabled but require at least ${Math.ceil(coverage.monthlyCost / ELITE_PRICE)} subscribers for break-even. ` +
      `Coverage ratio: ${coverage.coverageRatio.toFixed(2)}, Deficit: $${Math.abs(coverage.headroomUSD).toFixed(2)}/month.`
    );
    console.log(`   ⚠️  WARNING: Enabled pools require subscribers for profitability`);
  } else {
    console.log(`   ✅ Cost coverage OK`);
  }

  // Additional warning: If coverage ratio is below 1.15 (low margin)
  if (coverage.coverageRatio >= 1.0 && coverage.coverageRatio < 1.15) {
    warnings.push(
      `Low profit margin: Coverage ratio is ${coverage.coverageRatio.toFixed(2)} (< 1.15). ` +
      `Consider increasing MIN_ELITE_SUBS or disabling pools for healthier margins.`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Check 4: Verify pool priority values are valid
 */
function checkPoolPriorities(): ViolationResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  const allPools = getAllElitePools();

  console.log(`\n📋 Check 4: Pool priorities are valid`);

  for (const pool of allPools) {
    if (pool.priority === undefined || pool.priority === null) {
      violations.push(`Pool "${pool.poolId}" is missing priority`);
    } else if (!Number.isInteger(pool.priority) || pool.priority < 1) {
      violations.push(
        `Pool "${pool.poolId}" has invalid priority ${pool.priority} (must be integer ≥ 1)`
      );
    } else {
      console.log(`   ✅ ${pool.poolId}: priority ${pool.priority}`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Check 5: Verify cadence values are reasonable
 */
function checkPoolCadences(): ViolationResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  const allPools = getAllElitePools();

  console.log(`\n📋 Check 5: Pool cadences are reasonable`);

  const MIN_CADENCE_MINUTES = 5;
  const MAX_CADENCE_MINUTES = 1440; // 24 hours

  for (const pool of allPools) {
    if (
      pool.cadenceMinutes === undefined ||
      pool.cadenceMinutes === null ||
      isNaN(pool.cadenceMinutes)
    ) {
      violations.push(`Pool "${pool.poolId}" has invalid cadenceMinutes`);
    } else if (pool.cadenceMinutes < MIN_CADENCE_MINUTES) {
      violations.push(
        `Pool "${pool.poolId}" cadence ${pool.cadenceMinutes}min is too aggressive (min: ${MIN_CADENCE_MINUTES}min)`
      );
    } else if (pool.cadenceMinutes > MAX_CADENCE_MINUTES) {
      violations.push(
        `Pool "${pool.poolId}" cadence ${pool.cadenceMinutes}min is too slow (max: ${MAX_CADENCE_MINUTES}min)`
      );
    } else {
      console.log(`   ✅ ${pool.poolId}: ${pool.cadenceMinutes} minutes`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║          CI ENFORCEMENT: Elite Pool Economics Verification           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  console.log('\n📊 Configuration:');
  console.log(`   MIN_ELITE_SUBS: ${MIN_ELITE_SUBS}`);
  console.log(`   ELITE_PRICE: $${ELITE_PRICE}`);
  console.log(`   Apify CU Price: $${APIFY_CU_PRICE_USD}/CU`);

  // Run all checks
  const checks = [
    { name: 'Cost Declaration', fn: checkAllPoolsHaveCost },
    { name: 'Enabled Pool Costs', fn: checkEnabledPoolsHaveValidCost },
    { name: 'Cost Coverage', fn: checkCostCoverage },
    { name: 'Pool Priorities', fn: checkPoolPriorities },
    { name: 'Pool Cadences', fn: checkPoolCadences },
  ];

  const allViolations: string[] = [];
  const allWarnings: string[] = [];
  let allPassed = true;

  for (const check of checks) {
    const result = check.fn();
    allViolations.push(...result.violations);
    allWarnings.push(...result.warnings);

    if (!result.passed) {
      allPassed = false;
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('VERIFICATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (allViolations.length > 0) {
    console.log('\n❌ VIOLATIONS DETECTED:\n');
    allViolations.forEach((v, i) => {
      console.log(`${i + 1}. ${v}`);
    });
  }

  if (allWarnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    allWarnings.forEach((w, i) => {
      console.log(`${i + 1}. ${w}`);
    });
  }

  if (allPassed && allViolations.length === 0) {
    console.log('\n✅ All checks passed!');
    console.log('   Elite pool economics are valid.');

    // Show summary stats
    const enabledPools = getEnabledElitePools();
    const totalCU = calculateTotalMonthlyCU();

    if (enabledPools.length > 0) {
      const totalCost = totalCU * APIFY_CU_PRICE_USD;
      console.log(`\n📊 Enabled Pools Summary:`);
      console.log(`   Pools: ${enabledPools.length}`);
      console.log(`   Total Monthly CU: ${totalCU}`);
      console.log(`   Total Monthly Cost: $${totalCost.toFixed(2)}`);

      if (MIN_ELITE_SUBS > 0) {
        const revenue = MIN_ELITE_SUBS * ELITE_PRICE;
        console.log(`   Break-even with ${MIN_ELITE_SUBS} subscribers: $${revenue.toFixed(2)} revenue`);
      }
    }

    process.exit(0);
  } else {
    console.log('\n🚫 VERIFICATION FAILED');
    console.log('   Please fix the violations above before merging.');
    process.exit(1);
  }
}

// Run main and handle errors
main().catch((error) => {
  console.error('\n💥 Verification script error:');
  console.error(error);
  process.exit(1);
});
