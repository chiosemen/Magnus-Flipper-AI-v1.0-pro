/**
 * Policy Enforcement Module
 * 
 * Enforces business rules including floor prices, margin requirements,
 * maximum discount limits, and risk controls for tech device pricing.
 * 
 * All risk control enforcement is centralized here to avoid scattered checks.
 */

import type { PricingPolicy, RiskControlConfig } from './types';
import { PricingHaltedError } from './types';

// ============================================================================
// Risk Control (Kill Switch)
// ============================================================================

/**
 * Global risk control state
 * 
 * Default: reads from TECH_TRADE_RISK_HALT environment variable
 * Can be overridden programmatically for testing via setRiskControlConfig()
 */
let riskControlConfig: RiskControlConfig = {
  pricingHalted: process.env.TECH_TRADE_RISK_HALT === 'true',
  haltReason: process.env.TECH_TRADE_RISK_HALT === 'true' 
    ? 'Environment variable TECH_TRADE_RISK_HALT is set' 
    : undefined,
};

/**
 * Set risk control configuration
 * 
 * Primary use case: testing, admin overrides
 * 
 * @param config - New risk control configuration
 */
export function setRiskControlConfig(config: RiskControlConfig): void {
  riskControlConfig = { ...config };
}

/**
 * Get current risk control configuration
 * 
 * @returns Current risk control state
 */
export function getRiskControlConfig(): RiskControlConfig {
  return { ...riskControlConfig };
}

/**
 * Check if pricing is currently halted
 * 
 * When halted:
 * - Anchor blending should be skipped
 * - B2C quotes should be marked as pricingFrozen
 * - Bulk/B2B operations should be rejected
 * 
 * @returns true if pricing is halted
 */
export function isPricingHalted(): boolean {
  return riskControlConfig.pricingHalted;
}

/**
 * Assert that pricing is not halted
 * 
 * Use for B2C quote operations where we want to continue but mark as frozen.
 * This function does NOT throw - it just returns the halted state.
 * For operations that must be blocked, use assertBulkTradeAllowed().
 * 
 * @returns true if pricing is halted (caller should mark quote as frozen)
 */
export function checkPricingHalted(): boolean {
  return riskControlConfig.pricingHalted;
}

/**
 * Assert that bulk/B2B trades are allowed
 * 
 * Throws PricingHaltedError if risk halt is active.
 * Bulk trades MUST be rejected when halted - no fallback.
 * 
 * @throws PricingHaltedError if pricing is halted
 */
export function assertBulkTradeAllowed(): void {
  if (riskControlConfig.pricingHalted) {
    throw new PricingHaltedError(
      riskControlConfig.haltReason || 'Bulk trades are disabled during risk halt'
    );
  }
}

/**
 * Reset risk control to default state (reads from env)
 * 
 * Primarily for test cleanup
 */
export function resetRiskControl(): void {
  riskControlConfig = {
    pricingHalted: process.env.TECH_TRADE_RISK_HALT === 'true',
    haltReason: process.env.TECH_TRADE_RISK_HALT === 'true'
      ? 'Environment variable TECH_TRADE_RISK_HALT is set'
      : undefined,
  };
}

/**
 * Round a number to 2 decimal places
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Enforce absolute floor price from policy
 * 
 * @param price - The calculated price
 * @param policy - The pricing policy
 * @returns Price raised to floor if necessary
 */
export function enforceFloorPrice(price: number, policy: PricingPolicy): number {
  // Handle NaN, undefined, or invalid prices
  if (!Number.isFinite(price) || price < 0) {
    return policy.absoluteFloor;
  }
  
  return round2(Math.max(price, policy.absoluteFloor));
}

/**
 * Enforce minimum margin requirement
 * 
 * Formula: requiredPrice = cost / (1 - minMarginPercent)
 * 
 * @param price - The calculated price
 * @param cost - Our acquisition cost
 * @param policy - The pricing policy
 * @returns Price raised to meet margin requirement if necessary
 */
export function enforceMarginRequirement(
  price: number,
  cost: number | undefined,
  policy: PricingPolicy
): number {
  // If no cost or zero cost, any price is acceptable
  if (!cost || cost <= 0) {
    return round2(price);
  }

  // Handle edge case of 100% margin (would require infinite price)
  if (policy.minMarginPercent >= 1) {
    // Cap at a reasonable multiple (10x cost)
    const cappedRequiredPrice = cost * 10;
    return round2(Math.max(price, cappedRequiredPrice));
  }

  // Calculate required price to achieve minimum margin
  // margin = (price - cost) / price
  // Solving for price: price = cost / (1 - margin)
  const requiredPrice = cost / (1 - policy.minMarginPercent);

  return round2(Math.max(price, requiredPrice));
}

/**
 * Enforce maximum discount limit
 * 
 * @param price - The calculated price
 * @param basePrice - The original base price
 * @param maxDiscountPercent - Maximum allowed discount (0.0 - 1.0)
 * @returns Price raised to max discount limit if necessary
 */
export function enforceMaxDiscount(
  price: number,
  basePrice: number,
  maxDiscountPercent: number
): number {
  // If price is at or above base, no discount enforcement needed
  if (price >= basePrice) {
    return round2(price);
  }

  // Calculate minimum allowed price based on max discount
  const minAllowedPrice = basePrice * (1 - maxDiscountPercent);

  return round2(Math.max(price, minAllowedPrice));
}

/**
 * Check if a price is below the absolute floor
 */
export function isPriceBelowFloor(price: number, policy: PricingPolicy): boolean {
  return price < policy.absoluteFloor;
}

/**
 * Get the effective floor price considering both absolute floor and margin requirement
 * 
 * @param policy - The pricing policy
 * @param cost - Optional acquisition cost
 * @returns The higher of absolute floor or margin-based floor
 */
export function getEffectiveFloor(policy: PricingPolicy, cost?: number): number {
  const absoluteFloor = policy.absoluteFloor;

  // If no cost, just use absolute floor
  if (!cost || cost <= 0) {
    return absoluteFloor;
  }

  // Handle edge case of 100% margin
  if (policy.minMarginPercent >= 1) {
    return Math.max(absoluteFloor, cost * 10);
  }

  // Calculate margin-based floor
  const marginFloor = cost / (1 - policy.minMarginPercent);

  return round2(Math.max(absoluteFloor, marginFloor));
}

/**
 * Validation result for price against policy
 */
export interface PolicyValidationResult {
  isValid: boolean;
  violations: string[];
  suggestedPrice?: number;
}

/**
 * Validate a price against all policy requirements
 * 
 * @param price - The price to validate
 * @param cost - Our acquisition cost
 * @param policy - The pricing policy
 * @returns Validation result with any violations
 */
export function validatePriceAgainstPolicy(
  price: number,
  cost: number,
  policy: PricingPolicy
): PolicyValidationResult {
  const violations: string[] = [];

  // Check absolute floor
  if (price < policy.absoluteFloor) {
    violations.push('below_absolute_floor');
  }

  // Check margin requirement (only if we have a cost)
  if (cost > 0) {
    const requiredPrice = policy.minMarginPercent >= 1
      ? cost * 10
      : cost / (1 - policy.minMarginPercent);
    
    if (price < requiredPrice) {
      violations.push('below_margin_requirement');
    }
  }

  // Calculate suggested price if there are violations
  let suggestedPrice: number | undefined;
  if (violations.length > 0) {
    suggestedPrice = getEffectiveFloor(policy, cost);
  }

  return {
    isValid: violations.length === 0,
    violations,
    suggestedPrice,
  };
}

/**
 * Calculate the total policy adjustment needed
 * 
 * @param price - Original calculated price
 * @param cost - Acquisition cost
 * @param policy - Pricing policy
 * @returns The adjustment amount (positive means price was raised)
 */
export function calculatePolicyAdjustment(
  price: number,
  cost: number,
  policy: PricingPolicy
): number {
  // Handle invalid price
  if (!Number.isFinite(price)) {
    return policy.absoluteFloor;
  }

  // Get the effective floor (higher of absolute and margin)
  const effectiveFloor = getEffectiveFloor(policy, cost);

  // If price is already above floor, no adjustment needed
  if (price >= effectiveFloor) {
    return 0;
  }

  // Return the adjustment needed
  return round2(effectiveFloor - price);
}

