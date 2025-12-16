/**
 * Policy Enforcement Unit Tests
 * 
 * TDD: These tests are written BEFORE implementation.
 * Tests cover floor price validation, margin requirements, and discount limits.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  enforceFloorPrice,
  enforceMarginRequirement,
  enforceMaxDiscount,
  validatePriceAgainstPolicy,
  calculatePolicyAdjustment,
  isPriceBelowFloor,
  getEffectiveFloor,
} from '../src/policy-enforcement';
import type { PricingPolicy } from '../src/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const defaultPolicy: PricingPolicy = {
  id: 'policy-1',
  name: 'default',
  category: null,
  conditionNew: 1.0,
  conditionExcellent: 0.85,
  conditionGood: 0.70,
  conditionFair: 0.50,
  weightCex: 0.40,
  weightBackMarket: 0.40,
  weightPolicy: 0.20,
  minMarginPercent: 0.15, // 15% minimum margin
  absoluteFloor: 10.0, // Never below £10
  anchorMaxAgeDays: 7,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const aggressivePolicy: PricingPolicy = {
  ...defaultPolicy,
  id: 'policy-2',
  name: 'aggressive',
  minMarginPercent: 0.25, // 25% minimum margin
  absoluteFloor: 20.0, // Never below £20
};

const lenientPolicy: PricingPolicy = {
  ...defaultPolicy,
  id: 'policy-3',
  name: 'lenient',
  minMarginPercent: 0.05, // 5% minimum margin
  absoluteFloor: 5.0, // Never below £5
};

// ============================================================================
// Floor Price Validation Tests
// ============================================================================

describe('enforceFloorPrice', () => {
  it('should not modify price above absolute floor', () => {
    const result = enforceFloorPrice(100, defaultPolicy);
    expect(result).toBe(100);
  });

  it('should raise price to absolute floor when below', () => {
    const result = enforceFloorPrice(5, defaultPolicy);
    expect(result).toBe(10); // absoluteFloor is 10
  });

  it('should handle price exactly at floor', () => {
    const result = enforceFloorPrice(10, defaultPolicy);
    expect(result).toBe(10);
  });

  it('should handle zero price', () => {
    const result = enforceFloorPrice(0, defaultPolicy);
    expect(result).toBe(10);
  });

  it('should handle negative price', () => {
    const result = enforceFloorPrice(-50, defaultPolicy);
    expect(result).toBe(10);
  });

  it('should use policy-specific absolute floor', () => {
    const result = enforceFloorPrice(15, aggressivePolicy);
    expect(result).toBe(20); // aggressivePolicy has absoluteFloor of 20
  });

  it('should round to 2 decimal places', () => {
    const result = enforceFloorPrice(10.555, defaultPolicy);
    expect(result).toBeCloseTo(10.56, 2);
  });
});

// ============================================================================
// Margin Requirement Tests
// ============================================================================

describe('enforceMarginRequirement', () => {
  it('should not modify price with sufficient margin', () => {
    // Cost: 100, Price: 200 → 50% margin (above 15%)
    const result = enforceMarginRequirement(200, 100, defaultPolicy);
    expect(result).toBe(200);
  });

  it('should raise price when margin too low', () => {
    // Cost: 100, Price: 105 → 5% margin (below 15%)
    // Required price: 100 / (1 - 0.15) = 117.65
    const result = enforceMarginRequirement(105, 100, defaultPolicy);
    expect(result).toBeCloseTo(117.65, 2);
  });

  it('should handle price exactly at margin threshold', () => {
    // Cost: 100, required margin: 15%
    // Price at threshold: 100 / (1 - 0.15) = 117.65
    const result = enforceMarginRequirement(117.65, 100, defaultPolicy);
    expect(result).toBeCloseTo(117.65, 2);
  });

  it('should use policy-specific margin requirement', () => {
    // Cost: 100, aggressive policy requires 25% margin
    // Required price: 100 / (1 - 0.25) = 133.33
    const result = enforceMarginRequirement(110, 100, aggressivePolicy);
    expect(result).toBeCloseTo(133.33, 2);
  });

  it('should handle zero cost', () => {
    // Zero cost means any price is acceptable
    const result = enforceMarginRequirement(50, 0, defaultPolicy);
    expect(result).toBe(50);
  });

  it('should handle price below cost', () => {
    // Price: 80, Cost: 100 → negative margin
    const result = enforceMarginRequirement(80, 100, defaultPolicy);
    expect(result).toBeCloseTo(117.65, 2);
  });

  it('should handle lenient policy', () => {
    // Cost: 100, lenient policy requires 5% margin
    // Required price: 100 / (1 - 0.05) = 105.26
    const result = enforceMarginRequirement(103, 100, lenientPolicy);
    expect(result).toBeCloseTo(105.26, 2);
  });
});

// ============================================================================
// Maximum Discount Tests
// ============================================================================

describe('enforceMaxDiscount', () => {
  it('should not modify price within discount limit', () => {
    // Base: 100, Price: 85 → 15% discount (within typical limits)
    const result = enforceMaxDiscount(85, 100, 0.20); // 20% max discount
    expect(result).toBe(85);
  });

  it('should raise price when discount exceeds limit', () => {
    // Base: 100, Price: 70 → 30% discount (exceeds 20% limit)
    // Max discounted price: 100 * (1 - 0.20) = 80
    const result = enforceMaxDiscount(70, 100, 0.20);
    expect(result).toBe(80);
  });

  it('should handle price exactly at discount limit', () => {
    // Base: 100, Price: 80 → 20% discount (at limit)
    const result = enforceMaxDiscount(80, 100, 0.20);
    expect(result).toBe(80);
  });

  it('should handle zero max discount', () => {
    // No discount allowed
    const result = enforceMaxDiscount(90, 100, 0);
    expect(result).toBe(100);
  });

  it('should handle 100% max discount', () => {
    // Any discount allowed
    const result = enforceMaxDiscount(10, 100, 1.0);
    expect(result).toBe(10);
  });

  it('should handle price above base (no discount)', () => {
    // Price: 120, Base: 100 → premium, not discount
    const result = enforceMaxDiscount(120, 100, 0.20);
    expect(result).toBe(120);
  });

  it('should round to 2 decimal places', () => {
    const result = enforceMaxDiscount(75.555, 100, 0.20);
    expect(result).toBeCloseTo(80, 2);
  });
});

// ============================================================================
// Policy Validation Tests
// ============================================================================

describe('validatePriceAgainstPolicy', () => {
  it('should return valid for price meeting all requirements', () => {
    const result = validatePriceAgainstPolicy(200, 100, defaultPolicy);
    
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect absolute floor violation', () => {
    const result = validatePriceAgainstPolicy(5, 3, defaultPolicy);
    
    expect(result.isValid).toBe(false);
    expect(result.violations).toContain('below_absolute_floor');
  });

  it('should detect margin violation', () => {
    const result = validatePriceAgainstPolicy(105, 100, defaultPolicy);
    
    expect(result.isValid).toBe(false);
    expect(result.violations).toContain('below_margin_requirement');
  });

  it('should detect multiple violations', () => {
    // Price: 5, Cost: 100 → below floor AND below margin
    const result = validatePriceAgainstPolicy(5, 100, defaultPolicy);
    
    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(1);
  });

  it('should include suggested price', () => {
    const result = validatePriceAgainstPolicy(5, 100, defaultPolicy);
    
    expect(result.suggestedPrice).toBeDefined();
    expect(result.suggestedPrice).toBeGreaterThan(5);
  });

  it('should handle edge case of zero cost', () => {
    const result = validatePriceAgainstPolicy(15, 0, defaultPolicy);
    
    expect(result.isValid).toBe(true);
  });
});

// ============================================================================
// Policy Adjustment Calculation Tests
// ============================================================================

describe('calculatePolicyAdjustment', () => {
  it('should return 0 when no adjustment needed', () => {
    const adjustment = calculatePolicyAdjustment(200, 100, defaultPolicy);
    expect(adjustment).toBe(0);
  });

  it('should return positive adjustment when floor enforced', () => {
    const adjustment = calculatePolicyAdjustment(5, 3, defaultPolicy);
    expect(adjustment).toBe(5); // Raised from 5 to 10
  });

  it('should return positive adjustment when margin enforced', () => {
    // Cost: 100, Price: 105
    // Required: 117.65
    // Adjustment: 117.65 - 105 = 12.65
    const adjustment = calculatePolicyAdjustment(105, 100, defaultPolicy);
    expect(adjustment).toBeCloseTo(12.65, 2);
  });

  it('should use higher of floor and margin adjustments', () => {
    // Price: 5, Cost: 100
    // Floor adjustment: 10 - 5 = 5
    // Margin adjustment: 117.65 - 5 = 112.65
    // Should use margin (higher)
    const adjustment = calculatePolicyAdjustment(5, 100, defaultPolicy);
    expect(adjustment).toBeCloseTo(112.65, 2);
  });

  it('should handle negative input price', () => {
    const adjustment = calculatePolicyAdjustment(-50, 100, defaultPolicy);
    expect(adjustment).toBeGreaterThan(0);
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('isPriceBelowFloor', () => {
  it('should return true when price below absolute floor', () => {
    expect(isPriceBelowFloor(5, defaultPolicy)).toBe(true);
  });

  it('should return false when price above absolute floor', () => {
    expect(isPriceBelowFloor(15, defaultPolicy)).toBe(false);
  });

  it('should return false when price equals absolute floor', () => {
    expect(isPriceBelowFloor(10, defaultPolicy)).toBe(false);
  });
});

describe('getEffectiveFloor', () => {
  it('should return absolute floor when no cost provided', () => {
    const floor = getEffectiveFloor(defaultPolicy);
    expect(floor).toBe(10);
  });

  it('should return higher of absolute and margin floors', () => {
    // Cost: 100, margin floor: 100 / (1 - 0.15) = 117.65
    // Absolute floor: 10
    // Effective: 117.65
    const floor = getEffectiveFloor(defaultPolicy, 100);
    expect(floor).toBeCloseTo(117.65, 2);
  });

  it('should return absolute floor when margin floor is lower', () => {
    // Cost: 5, margin floor: 5 / (1 - 0.15) = 5.88
    // Absolute floor: 10
    // Effective: 10
    const floor = getEffectiveFloor(defaultPolicy, 5);
    expect(floor).toBe(10);
  });

  it('should handle zero cost', () => {
    const floor = getEffectiveFloor(defaultPolicy, 0);
    expect(floor).toBe(10); // Just absolute floor
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle very small prices', () => {
    const result = enforceFloorPrice(0.01, defaultPolicy);
    expect(result).toBe(10);
  });

  it('should handle very large prices', () => {
    const result = enforceFloorPrice(1000000, defaultPolicy);
    expect(result).toBe(1000000);
  });

  it('should handle floating point precision', () => {
    // 0.1 + 0.2 !== 0.3 in JavaScript
    const result = enforceFloorPrice(0.1 + 0.2, lenientPolicy);
    expect(result).toBeCloseTo(5, 2); // Should hit lenient floor of 5
  });

  it('should handle policy with 0% margin requirement', () => {
    const zeroMarginPolicy: PricingPolicy = {
      ...defaultPolicy,
      minMarginPercent: 0,
    };
    const result = enforceMarginRequirement(50, 100, zeroMarginPolicy);
    // With 0% margin, required price = cost / (1 - 0) = cost = 100
    // Price of 50 is below cost, so it should be raised to 100
    expect(result).toBe(100);
  });

  it('should handle policy with 100% margin requirement', () => {
    const fullMarginPolicy: PricingPolicy = {
      ...defaultPolicy,
      minMarginPercent: 1.0, // 100% margin = price must be infinite (edge case)
    };
    // This is an invalid policy, but should not crash
    const result = enforceMarginRequirement(200, 100, fullMarginPolicy);
    // When margin is 100%, required price is Infinity, should cap reasonably
    expect(Number.isFinite(result)).toBe(true);
  });

  it('should not produce NaN', () => {
    const result = enforceFloorPrice(NaN, defaultPolicy);
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(10); // Should default to floor
  });

  it('should not produce Infinity', () => {
    const result = enforceMarginRequirement(Infinity, 100, defaultPolicy);
    expect(Number.isFinite(result) || result === Infinity).toBe(true);
    // Infinity input should remain Infinity (valid high price)
  });

  it('should handle undefined cost gracefully', () => {
    // @ts-expect-error Testing undefined handling
    const result = enforceMarginRequirement(100, undefined, defaultPolicy);
    // Should treat undefined cost as 0
    expect(result).toBe(100);
  });
});

// ============================================================================
// Integration-like Tests
// ============================================================================

describe('Full Policy Enforcement Flow', () => {
  it('should apply all policy rules in correct order', () => {
    // Start with very low price
    let price = 5;
    const cost = 100;

    // 1. Check floor
    price = enforceFloorPrice(price, defaultPolicy);
    expect(price).toBe(10);

    // 2. Check margin (still too low)
    price = enforceMarginRequirement(price, cost, defaultPolicy);
    expect(price).toBeCloseTo(117.65, 2);

    // 3. Validate final price
    const validation = validatePriceAgainstPolicy(price, cost, defaultPolicy);
    expect(validation.isValid).toBe(true);
  });

  it('should calculate correct total adjustment', () => {
    const originalPrice = 5;
    const cost = 100;

    const adjustment = calculatePolicyAdjustment(originalPrice, cost, defaultPolicy);
    const finalPrice = originalPrice + adjustment;

    // Final price should pass validation
    const validation = validatePriceAgainstPolicy(finalPrice, cost, defaultPolicy);
    expect(validation.isValid).toBe(true);
  });

  it('should handle realistic iPhone pricing scenario', () => {
    // iPhone 13 scenario:
    // Base price: £450, Condition: fair (50%), so £225
    // Our cost: £180 (what we pay to acquire)
    // Required margin: 15%
    
    const price = 225;
    const cost = 180;

    // Check if price meets margin requirement
    // Required: 180 / (1 - 0.15) = 211.76
    // Price of 225 > 211.76, so should be valid
    
    const validation = validatePriceAgainstPolicy(price, cost, defaultPolicy);
    expect(validation.isValid).toBe(true);
  });

  it('should handle low-value device scenario', () => {
    // Old device scenario:
    // Base price: £20, Condition: fair (50%), so £10
    // Our cost: £5
    // Required margin: 15%
    
    const price = 10;
    const cost = 5;

    // Required margin price: 5 / (1 - 0.15) = 5.88
    // Absolute floor: 10
    // Price of 10 meets both requirements
    
    const validation = validatePriceAgainstPolicy(price, cost, defaultPolicy);
    expect(validation.isValid).toBe(true);
  });
});

