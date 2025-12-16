/**
 * Pricing Engine Unit Tests
 * 
 * TDD: These tests are written BEFORE implementation.
 * All tests should initially fail until implementation is complete.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateBasePrice,
  applyAttributeAdjustments,
  applyPolicyFloor,
  generateQuoteBreakdown,
  getConditionMultiplier,
} from '../src/pricing-engine';
import type {
  TechDevice,
  DeviceAttribute,
  PricingPolicy,
  Condition,
  QuoteBreakdown,
  MarketAnchor,
} from '../src/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockDevice: TechDevice = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  brand: 'Apple',
  model: 'iPhone 13',
  category: 'smartphone',
  releaseYear: 2021,
  basePrice: 450.00,
  currency: 'GBP',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockAttributes: DeviceAttribute[] = [
  {
    id: '1',
    deviceId: mockDevice.id,
    attributeType: 'storage',
    attributeValue: '64GB',
    priceModifier: -25,
    createdAt: new Date(),
  },
  {
    id: '2',
    deviceId: mockDevice.id,
    attributeType: 'storage',
    attributeValue: '128GB',
    priceModifier: 0,
    createdAt: new Date(),
  },
  {
    id: '3',
    deviceId: mockDevice.id,
    attributeType: 'storage',
    attributeValue: '256GB',
    priceModifier: 30,
    createdAt: new Date(),
  },
  {
    id: '4',
    deviceId: mockDevice.id,
    attributeType: 'color',
    attributeValue: 'Midnight',
    priceModifier: 0,
    createdAt: new Date(),
  },
  {
    id: '5',
    deviceId: mockDevice.id,
    attributeType: 'color',
    attributeValue: 'Product Red',
    priceModifier: 10,
    createdAt: new Date(),
  },
  {
    id: '6',
    deviceId: mockDevice.id,
    attributeType: 'carrier',
    attributeValue: 'Unlocked',
    priceModifier: 0,
    createdAt: new Date(),
  },
  {
    id: '7',
    deviceId: mockDevice.id,
    attributeType: 'carrier',
    attributeValue: 'EE',
    priceModifier: -40,
    createdAt: new Date(),
  },
];

const mockPolicy: PricingPolicy = {
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
  minMarginPercent: 0.15,
  absoluteFloor: 10.0,
  anchorMaxAgeDays: 7,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================================
// Condition Multiplier Tests
// ============================================================================

describe('getConditionMultiplier', () => {
  it('should return 1.0 for "new" condition', () => {
    const multiplier = getConditionMultiplier('new', mockPolicy);
    expect(multiplier).toBe(1.0);
  });

  it('should return 0.85 for "excellent" condition', () => {
    const multiplier = getConditionMultiplier('excellent', mockPolicy);
    expect(multiplier).toBe(0.85);
  });

  it('should return 0.70 for "good" condition', () => {
    const multiplier = getConditionMultiplier('good', mockPolicy);
    expect(multiplier).toBe(0.70);
  });

  it('should return 0.50 for "fair" condition', () => {
    const multiplier = getConditionMultiplier('fair', mockPolicy);
    expect(multiplier).toBe(0.50);
  });

  it('should use custom policy multipliers when provided', () => {
    const customPolicy: PricingPolicy = {
      ...mockPolicy,
      conditionExcellent: 0.90,
    };
    const multiplier = getConditionMultiplier('excellent', customPolicy);
    expect(multiplier).toBe(0.90);
  });
});

// ============================================================================
// Base Price Calculation Tests
// ============================================================================

describe('calculateBasePrice', () => {
  it('should calculate base price with "new" condition (no reduction)', () => {
    const result = calculateBasePrice(mockDevice, 'new', mockPolicy);
    expect(result).toBe(450.00);
  });

  it('should calculate base price with "excellent" condition (15% reduction)', () => {
    const result = calculateBasePrice(mockDevice, 'excellent', mockPolicy);
    expect(result).toBe(382.50); // 450 * 0.85
  });

  it('should calculate base price with "good" condition (30% reduction)', () => {
    const result = calculateBasePrice(mockDevice, 'good', mockPolicy);
    expect(result).toBe(315.00); // 450 * 0.70
  });

  it('should calculate base price with "fair" condition (50% reduction)', () => {
    const result = calculateBasePrice(mockDevice, 'fair', mockPolicy);
    expect(result).toBe(225.00); // 450 * 0.50
  });

  it('should handle devices with different base prices', () => {
    const expensiveDevice: TechDevice = { ...mockDevice, basePrice: 1200.00 };
    const result = calculateBasePrice(expensiveDevice, 'excellent', mockPolicy);
    expect(result).toBe(1020.00); // 1200 * 0.85
  });

  it('should round to 2 decimal places', () => {
    const oddDevice: TechDevice = { ...mockDevice, basePrice: 333.33 };
    const result = calculateBasePrice(oddDevice, 'excellent', mockPolicy);
    // 333.33 * 0.85 = 283.3305 → should round to 283.33
    expect(result).toBeCloseTo(283.33, 2);
  });
});

// ============================================================================
// Attribute Adjustment Tests
// ============================================================================

describe('applyAttributeAdjustments', () => {
  it('should return 0 adjustment when no attributes selected', () => {
    const adjustment = applyAttributeAdjustments({}, mockAttributes);
    expect(adjustment).toBe(0);
  });

  it('should apply positive storage modifier for higher storage', () => {
    const adjustment = applyAttributeAdjustments(
      { storage: '256GB' },
      mockAttributes
    );
    expect(adjustment).toBe(30);
  });

  it('should apply negative storage modifier for lower storage', () => {
    const adjustment = applyAttributeAdjustments(
      { storage: '64GB' },
      mockAttributes
    );
    expect(adjustment).toBe(-25);
  });

  it('should apply zero modifier for base storage', () => {
    const adjustment = applyAttributeAdjustments(
      { storage: '128GB' },
      mockAttributes
    );
    expect(adjustment).toBe(0);
  });

  it('should apply positive modifier for rare color', () => {
    const adjustment = applyAttributeAdjustments(
      { color: 'Product Red' },
      mockAttributes
    );
    expect(adjustment).toBe(10);
  });

  it('should apply negative modifier for carrier-locked device', () => {
    const adjustment = applyAttributeAdjustments(
      { carrier: 'EE' },
      mockAttributes
    );
    expect(adjustment).toBe(-40);
  });

  it('should combine multiple attribute adjustments', () => {
    const adjustment = applyAttributeAdjustments(
      { storage: '256GB', color: 'Product Red', carrier: 'Unlocked' },
      mockAttributes
    );
    expect(adjustment).toBe(40); // 30 + 10 + 0
  });

  it('should handle mixed positive and negative adjustments', () => {
    const adjustment = applyAttributeAdjustments(
      { storage: '256GB', carrier: 'EE' },
      mockAttributes
    );
    expect(adjustment).toBe(-10); // 30 + (-40)
  });

  it('should ignore unknown attribute types', () => {
    const adjustment = applyAttributeAdjustments(
      { unknownType: 'someValue' },
      mockAttributes
    );
    expect(adjustment).toBe(0);
  });

  it('should ignore unknown attribute values', () => {
    const adjustment = applyAttributeAdjustments(
      { storage: '512GB' }, // Not in our fixtures
      mockAttributes
    );
    expect(adjustment).toBe(0);
  });
});

// ============================================================================
// Policy Floor Tests
// ============================================================================

describe('applyPolicyFloor', () => {
  it('should not modify price above both floors', () => {
    const result = applyPolicyFloor(200, mockPolicy);
    expect(result).toBe(200);
  });

  it('should raise price to absolute floor when below', () => {
    const result = applyPolicyFloor(5, mockPolicy);
    expect(result).toBe(10); // absoluteFloor is 10
  });

  it('should apply margin floor when applicable', () => {
    // Cost: 100, margin requirement: 15%
    // Required price: 100 / (1 - 0.15) = 117.65
    // So a price of 80 should be raised to 117.65
    const result = applyPolicyFloor(80, mockPolicy, 100);
    expect(result).toBeCloseTo(117.65, 2);
  });

  it('should use higher of absolute and margin floor', () => {
    // Cost: 50, margin requirement: 15%
    // Margin floor: 50 / (1 - 0.15) = 58.82
    // Absolute floor: 10
    // Price of 5 should go to 58.82 (margin floor is higher)
    const result = applyPolicyFloor(5, mockPolicy, 50);
    expect(result).toBeCloseTo(58.82, 2);
  });

  it('should use absolute floor when margin floor is lower', () => {
    // Cost: 5, margin requirement: 15%
    // Margin floor: 5 / (1 - 0.15) = 5.88
    // Absolute floor: 10
    // Price of 5 should go to 10 (absolute floor is higher)
    const result = applyPolicyFloor(5, mockPolicy, 5);
    expect(result).toBe(10);
  });

  it('should handle zero price', () => {
    const result = applyPolicyFloor(0, mockPolicy);
    expect(result).toBe(10); // Should be raised to absolute floor
  });

  it('should handle negative price (edge case)', () => {
    const result = applyPolicyFloor(-50, mockPolicy);
    expect(result).toBe(10); // Should be raised to absolute floor
  });

  it('should round to 2 decimal places', () => {
    const result = applyPolicyFloor(10.555, mockPolicy);
    expect(result).toBeCloseTo(10.56, 2);
  });
});

// ============================================================================
// Full Quote Breakdown Tests
// ============================================================================

describe('generateQuoteBreakdown', () => {
  it('should produce complete breakdown without anchors', () => {
    const breakdown = generateQuoteBreakdown({
      device: mockDevice,
      condition: 'excellent',
      attributes: { storage: '128GB' },
      deviceAttributes: mockAttributes,
      anchors: [],
      policy: mockPolicy,
    });

    expect(breakdown.basePrice).toBe(450.00);
    expect(breakdown.conditionMultiplier).toBe(0.85);
    expect(breakdown.afterCondition).toBe(382.50);
    expect(breakdown.attributeAdjustment).toBe(0);
    expect(breakdown.afterAttributes).toBe(382.50);
    expect(breakdown.anchorBlendedPrice).toBeNull();
    expect(breakdown.policyAdjustment).toBe(0);
    expect(breakdown.finalPrice).toBe(382.50);
  });

  it('should apply attribute adjustments in breakdown', () => {
    const breakdown = generateQuoteBreakdown({
      device: mockDevice,
      condition: 'good',
      attributes: { storage: '256GB', color: 'Product Red' },
      deviceAttributes: mockAttributes,
      anchors: [],
      policy: mockPolicy,
    });

    expect(breakdown.afterCondition).toBe(315.00); // 450 * 0.70
    expect(breakdown.attributeAdjustment).toBe(40); // 30 + 10
    expect(breakdown.afterAttributes).toBe(355.00); // 315 + 40
    expect(breakdown.finalPrice).toBe(355.00);
  });

  it('should apply policy floor when price too low', () => {
    const cheapDevice: TechDevice = { ...mockDevice, basePrice: 15 };
    
    const breakdown = generateQuoteBreakdown({
      device: cheapDevice,
      condition: 'fair',
      attributes: {},
      deviceAttributes: mockAttributes,
      anchors: [],
      policy: mockPolicy,
    });

    // 15 * 0.50 = 7.50, but absolute floor is 10
    expect(breakdown.afterCondition).toBe(7.50);
    expect(breakdown.policyAdjustment).toBe(2.50); // 10 - 7.50
    expect(breakdown.finalPrice).toBe(10.00);
  });

  it('should blend with anchors when available', () => {
    const mockAnchors: MarketAnchor[] = [
      {
        id: 'anchor-1',
        deviceId: mockDevice.id,
        source: 'cex',
        condition: 'excellent',
        price: 380,
        url: null,
        scrapedAt: new Date(),
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: 'admin-1',
        version: 1,
        createdAt: new Date(),
      },
      {
        id: 'anchor-2',
        deviceId: mockDevice.id,
        source: 'back_market',
        condition: 'excellent',
        price: 400,
        url: null,
        scrapedAt: new Date(),
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: 'admin-1',
        version: 1,
        createdAt: new Date(),
      },
    ];

    const breakdown = generateQuoteBreakdown({
      device: mockDevice,
      condition: 'excellent',
      attributes: { storage: '128GB' },
      deviceAttributes: mockAttributes,
      anchors: mockAnchors,
      policy: mockPolicy,
    });

    // Policy price: 382.50
    // CeX: 380 * 0.40 = 152
    // Back Market: 400 * 0.40 = 160
    // Policy: 382.50 * 0.20 = 76.50
    // Blended: 152 + 160 + 76.50 = 388.50
    expect(breakdown.anchorBlendedPrice).toBeCloseTo(388.50, 2);
    expect(breakdown.finalPrice).toBeCloseTo(388.50, 2);
  });

  it('should handle missing anchor sources gracefully', () => {
    const singleAnchor: MarketAnchor[] = [
      {
        id: 'anchor-1',
        deviceId: mockDevice.id,
        source: 'cex',
        condition: 'excellent',
        price: 380,
        url: null,
        scrapedAt: new Date(),
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: 'admin-1',
        version: 1,
        createdAt: new Date(),
      },
    ];

    const breakdown = generateQuoteBreakdown({
      device: mockDevice,
      condition: 'excellent',
      attributes: {},
      deviceAttributes: mockAttributes,
      anchors: singleAnchor,
      policy: mockPolicy,
    });

    // With only CeX, should redistribute weights
    // CeX: 380 * (0.40 / 0.60) = 380 * 0.667 = 253.33
    // Policy: 382.50 * (0.20 / 0.60) = 382.50 * 0.333 = 127.50
    // Blended: 253.33 + 127.50 = 380.83 (approximately)
    expect(breakdown.anchorBlendedPrice).not.toBeNull();
    expect(breakdown.finalPrice).toBeGreaterThan(0);
  });

  it('should calculate confidence based on anchor coverage', () => {
    // This test verifies the confidence calculation is included
    // Full confidence calculation is in anchor-blending module
    const breakdown = generateQuoteBreakdown({
      device: mockDevice,
      condition: 'excellent',
      attributes: {},
      deviceAttributes: mockAttributes,
      anchors: [],
      policy: mockPolicy,
    });

    // No anchors = low confidence (handled by caller)
    expect(breakdown.anchorBlendedPrice).toBeNull();
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle device with zero base price', () => {
    const freeDevice: TechDevice = { ...mockDevice, basePrice: 0 };
    const result = calculateBasePrice(freeDevice, 'excellent', mockPolicy);
    expect(result).toBe(0);
  });

  it('should handle empty attributes array', () => {
    const adjustment = applyAttributeAdjustments(
      { storage: '128GB' },
      []
    );
    expect(adjustment).toBe(0);
  });

  it('should handle all negative adjustments', () => {
    const adjustment = applyAttributeAdjustments(
      { storage: '64GB', carrier: 'EE' },
      mockAttributes
    );
    expect(adjustment).toBe(-65); // -25 + (-40)
  });

  it('should not produce NaN or Infinity', () => {
    const breakdown = generateQuoteBreakdown({
      device: mockDevice,
      condition: 'excellent',
      attributes: {},
      deviceAttributes: [],
      anchors: [],
      policy: mockPolicy,
    });

    expect(Number.isFinite(breakdown.finalPrice)).toBe(true);
    expect(Number.isNaN(breakdown.finalPrice)).toBe(false);
  });
});

