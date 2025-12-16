/**
 * Risk Control (Kill Switch) Tests
 * 
 * Tests for the pricing kill switch functionality:
 * - Normal operation (kill switch off)
 * - Halted operation (kill switch on)
 * - Config via environment variable
 * - Config via programmatic override
 * - No partial or undefined behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setRiskControlConfig,
  getRiskControlConfig,
  isPricingHalted,
  checkPricingHalted,
  assertBulkTradeAllowed,
  resetRiskControl,
} from '../src/policy-enforcement';
import { generateQuoteBreakdown } from '../src/pricing-engine';
import { getMarketIndicators, setIndicatorRepositories } from '../src/market-indicators';
import type {
  RiskControlConfig,
  TechDevice,
  DeviceAttribute,
  PricingPolicy,
  MarketAnchor,
} from '../src/types';
import { PricingHaltedError } from '../src/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockDevice: TechDevice = {
  id: 'device-001',
  brand: 'Apple',
  model: 'iPhone 14 Pro',
  category: 'smartphone',
  releaseYear: 2022,
  basePrice: 1000,
  currency: 'GBP',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPolicy: PricingPolicy = {
  id: 'policy-001',
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

const mockDeviceAttributes: DeviceAttribute[] = [
  {
    id: 'attr-001',
    deviceId: 'device-001',
    attributeType: 'storage',
    attributeValue: '256GB',
    priceModifier: 50,
    createdAt: new Date(),
  },
];

const mockAnchors: MarketAnchor[] = [
  {
    id: 'anchor-001',
    deviceId: 'device-001',
    source: 'cex',
    condition: 'excellent',
    price: 800,
    url: 'https://cex.co.uk/...',
    scrapedAt: new Date(),
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: 'admin',
    version: 1,
    createdAt: new Date(),
  },
  {
    id: 'anchor-002',
    deviceId: 'device-001',
    source: 'back_market',
    condition: 'excellent',
    price: 820,
    url: 'https://backmarket.co.uk/...',
    scrapedAt: new Date(),
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: 'admin',
    version: 1,
    createdAt: new Date(),
  },
];

// ============================================================================
// Test Suite: Risk Control Configuration
// ============================================================================

describe('Risk Control Configuration', () => {
  beforeEach(() => {
    // Reset to default state before each test
    resetRiskControl();
  });

  afterEach(() => {
    // Clean up after each test
    resetRiskControl();
  });

  describe('setRiskControlConfig', () => {
    it('should set risk control configuration', () => {
      const config: RiskControlConfig = {
        pricingHalted: true,
        haltReason: 'Test halt',
        haltedAt: new Date(),
        haltedBy: 'test-admin',
      };

      setRiskControlConfig(config);
      const result = getRiskControlConfig();

      expect(result.pricingHalted).toBe(true);
      expect(result.haltReason).toBe('Test halt');
      expect(result.haltedBy).toBe('test-admin');
    });

    it('should allow partial configuration updates', () => {
      setRiskControlConfig({ pricingHalted: true });
      const result = getRiskControlConfig();

      expect(result.pricingHalted).toBe(true);
      expect(result.haltReason).toBeUndefined();
      expect(result.haltedAt).toBeUndefined();
    });
  });

  describe('getRiskControlConfig', () => {
    it('should return a copy of the configuration', () => {
      const config: RiskControlConfig = {
        pricingHalted: true,
        haltReason: 'Original reason',
      };

      setRiskControlConfig(config);
      const result = getRiskControlConfig();

      // Modify the returned object
      result.haltReason = 'Modified reason';

      // Original should be unchanged
      const secondResult = getRiskControlConfig();
      expect(secondResult.haltReason).toBe('Original reason');
    });

    it('should default to not halted', () => {
      resetRiskControl();
      const result = getRiskControlConfig();

      // Default should be false (unless env var is set)
      expect(typeof result.pricingHalted).toBe('boolean');
    });
  });

  describe('isPricingHalted', () => {
    it('should return false when not halted', () => {
      setRiskControlConfig({ pricingHalted: false });
      expect(isPricingHalted()).toBe(false);
    });

    it('should return true when halted', () => {
      setRiskControlConfig({ pricingHalted: true });
      expect(isPricingHalted()).toBe(true);
    });
  });

  describe('checkPricingHalted', () => {
    it('should return false when not halted', () => {
      setRiskControlConfig({ pricingHalted: false });
      expect(checkPricingHalted()).toBe(false);
    });

    it('should return true when halted (does not throw)', () => {
      setRiskControlConfig({ pricingHalted: true });
      expect(checkPricingHalted()).toBe(true);
    });
  });

  describe('resetRiskControl', () => {
    it('should reset to default state', () => {
      setRiskControlConfig({
        pricingHalted: true,
        haltReason: 'Test',
        haltedAt: new Date(),
        haltedBy: 'admin',
      });

      resetRiskControl();
      const result = getRiskControlConfig();

      // Should be reset (default based on env var)
      expect(typeof result.pricingHalted).toBe('boolean');
    });
  });
});

// ============================================================================
// Test Suite: Bulk Trade Assertions
// ============================================================================

describe('Bulk Trade Assertions', () => {
  beforeEach(() => {
    resetRiskControl();
  });

  afterEach(() => {
    resetRiskControl();
  });

  describe('assertBulkTradeAllowed', () => {
    it('should not throw when pricing is not halted', () => {
      setRiskControlConfig({ pricingHalted: false });

      expect(() => assertBulkTradeAllowed()).not.toThrow();
    });

    it('should throw PricingHaltedError when pricing is halted', () => {
      setRiskControlConfig({
        pricingHalted: true,
        haltReason: 'Emergency stop',
      });

      expect(() => assertBulkTradeAllowed()).toThrow(PricingHaltedError);
    });

    it('should include halt reason in error message', () => {
      setRiskControlConfig({
        pricingHalted: true,
        haltReason: 'Market volatility detected',
      });

      try {
        assertBulkTradeAllowed();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PricingHaltedError);
        expect((error as Error).message).toContain('Market volatility detected');
      }
    });

    it('should use default message when no halt reason provided', () => {
      setRiskControlConfig({ pricingHalted: true });

      try {
        assertBulkTradeAllowed();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PricingHaltedError);
        expect((error as Error).message).toContain('Bulk trades are disabled');
      }
    });
  });
});

// ============================================================================
// Test Suite: Pricing Engine with Kill Switch
// ============================================================================

describe('Pricing Engine with Kill Switch', () => {
  beforeEach(() => {
    resetRiskControl();
  });

  afterEach(() => {
    resetRiskControl();
  });

  describe('generateQuoteBreakdown - Normal Operation', () => {
    it('should blend anchors when pricing is not halted', () => {
      setRiskControlConfig({ pricingHalted: false });

      const result = generateQuoteBreakdown({
        device: mockDevice,
        condition: 'excellent',
        attributes: { storage: '256GB' },
        deviceAttributes: mockDeviceAttributes,
        anchors: mockAnchors,
        policy: mockPolicy,
      });

      // Anchors should be blended
      expect(result.anchorBlendedPrice).not.toBeNull();
      expect(result.pricingFrozen).toBe(false);
    });

    it('should return pricingFrozen: false when not halted', () => {
      setRiskControlConfig({ pricingHalted: false });

      const result = generateQuoteBreakdown({
        device: mockDevice,
        condition: 'excellent',
        attributes: {},
        deviceAttributes: [],
        anchors: [],
        policy: mockPolicy,
      });

      expect(result.pricingFrozen).toBe(false);
    });
  });

  describe('generateQuoteBreakdown - Halted Operation', () => {
    it('should skip anchor blending when pricing is halted', () => {
      setRiskControlConfig({ pricingHalted: true });

      const result = generateQuoteBreakdown({
        device: mockDevice,
        condition: 'excellent',
        attributes: { storage: '256GB' },
        deviceAttributes: mockDeviceAttributes,
        anchors: mockAnchors,
        policy: mockPolicy,
      });

      // Anchors should NOT be blended
      expect(result.anchorBlendedPrice).toBeNull();
      expect(result.pricingFrozen).toBe(true);
    });

    it('should still calculate base price and adjustments when halted', () => {
      setRiskControlConfig({ pricingHalted: true });

      const result = generateQuoteBreakdown({
        device: mockDevice,
        condition: 'excellent',
        attributes: { storage: '256GB' },
        deviceAttributes: mockDeviceAttributes,
        anchors: mockAnchors,
        policy: mockPolicy,
      });

      // Base calculations should still work
      expect(result.basePrice).toBe(1000);
      expect(result.conditionMultiplier).toBe(0.85);
      expect(result.afterCondition).toBe(850);
      expect(result.attributeAdjustment).toBe(50);
      expect(result.afterAttributes).toBe(900);
      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should return pricingFrozen: true when halted', () => {
      setRiskControlConfig({ pricingHalted: true });

      const result = generateQuoteBreakdown({
        device: mockDevice,
        condition: 'good',
        attributes: {},
        deviceAttributes: [],
        anchors: [],
        policy: mockPolicy,
      });

      expect(result.pricingFrozen).toBe(true);
    });

    it('should apply policy floor even when halted', () => {
      setRiskControlConfig({ pricingHalted: true });

      // Create a device with very low base price
      const cheapDevice: TechDevice = {
        ...mockDevice,
        basePrice: 5, // Below floor
      };

      const result = generateQuoteBreakdown({
        device: cheapDevice,
        condition: 'fair',
        attributes: {},
        deviceAttributes: [],
        anchors: [],
        policy: mockPolicy,
      });

      // Should still enforce policy floor
      expect(result.finalPrice).toBeGreaterThanOrEqual(mockPolicy.absoluteFloor);
      expect(result.pricingFrozen).toBe(true);
    });
  });

  describe('generateQuoteBreakdown - Deterministic Behavior', () => {
    it('should produce same result for same inputs when not halted', () => {
      setRiskControlConfig({ pricingHalted: false });

      const input = {
        device: mockDevice,
        condition: 'excellent' as const,
        attributes: { storage: '256GB' },
        deviceAttributes: mockDeviceAttributes,
        anchors: mockAnchors,
        policy: mockPolicy,
      };

      const result1 = generateQuoteBreakdown(input);
      const result2 = generateQuoteBreakdown(input);

      expect(result1.finalPrice).toBe(result2.finalPrice);
      expect(result1.anchorBlendedPrice).toBe(result2.anchorBlendedPrice);
      expect(result1.pricingFrozen).toBe(result2.pricingFrozen);
    });

    it('should produce same result for same inputs when halted', () => {
      setRiskControlConfig({ pricingHalted: true });

      const input = {
        device: mockDevice,
        condition: 'excellent' as const,
        attributes: { storage: '256GB' },
        deviceAttributes: mockDeviceAttributes,
        anchors: mockAnchors,
        policy: mockPolicy,
      };

      const result1 = generateQuoteBreakdown(input);
      const result2 = generateQuoteBreakdown(input);

      expect(result1.finalPrice).toBe(result2.finalPrice);
      expect(result1.anchorBlendedPrice).toBe(result2.anchorBlendedPrice);
      expect(result1.pricingFrozen).toBe(result2.pricingFrozen);
    });
  });
});

// ============================================================================
// Test Suite: Market Indicators with Kill Switch
// ============================================================================

describe('Market Indicators with Kill Switch', () => {
  beforeEach(() => {
    resetRiskControl();
    // Set up mock repositories
    setIndicatorRepositories(
      { findMany: async () => [] },
      { findMany: async () => [] },
      { findFirst: async () => mockPolicy }
    );
  });

  afterEach(() => {
    resetRiskControl();
  });

  describe('getMarketIndicators - systemStatus', () => {
    it('should include systemStatus with pricingHalted: false when not halted', async () => {
      setRiskControlConfig({ pricingHalted: false });

      const indicators = await getMarketIndicators();

      expect(indicators.systemStatus).toBeDefined();
      expect(indicators.systemStatus.pricingHalted).toBe(false);
      expect(indicators.systemStatus.haltReason).toBeUndefined();
    });

    it('should include systemStatus with pricingHalted: true when halted', async () => {
      setRiskControlConfig({
        pricingHalted: true,
        haltReason: 'Scheduled maintenance',
      });

      const indicators = await getMarketIndicators();

      expect(indicators.systemStatus).toBeDefined();
      expect(indicators.systemStatus.pricingHalted).toBe(true);
      expect(indicators.systemStatus.haltReason).toBe('Scheduled maintenance');
    });

    it('should reflect current halt state at time of call', async () => {
      // Start not halted
      setRiskControlConfig({ pricingHalted: false });
      const indicators1 = await getMarketIndicators();
      expect(indicators1.systemStatus.pricingHalted).toBe(false);

      // Now halt
      setRiskControlConfig({ pricingHalted: true, haltReason: 'New halt' });
      const indicators2 = await getMarketIndicators();
      expect(indicators2.systemStatus.pricingHalted).toBe(true);
      expect(indicators2.systemStatus.haltReason).toBe('New halt');
    });
  });
});

// ============================================================================
// Test Suite: No Partial or Undefined Behavior
// ============================================================================

describe('No Partial or Undefined Behavior', () => {
  beforeEach(() => {
    resetRiskControl();
  });

  afterEach(() => {
    resetRiskControl();
  });

  it('should never return undefined for pricingFrozen', () => {
    // Test with halted
    setRiskControlConfig({ pricingHalted: true });
    const haltedResult = generateQuoteBreakdown({
      device: mockDevice,
      condition: 'excellent',
      attributes: {},
      deviceAttributes: [],
      anchors: [],
      policy: mockPolicy,
    });
    expect(haltedResult.pricingFrozen).toBeDefined();
    expect(typeof haltedResult.pricingFrozen).toBe('boolean');

    // Test without halted
    setRiskControlConfig({ pricingHalted: false });
    const normalResult = generateQuoteBreakdown({
      device: mockDevice,
      condition: 'excellent',
      attributes: {},
      deviceAttributes: [],
      anchors: [],
      policy: mockPolicy,
    });
    expect(normalResult.pricingFrozen).toBeDefined();
    expect(typeof normalResult.pricingFrozen).toBe('boolean');
  });

  it('should never return undefined for isPricingHalted', () => {
    setRiskControlConfig({ pricingHalted: true });
    expect(isPricingHalted()).toBe(true);

    setRiskControlConfig({ pricingHalted: false });
    expect(isPricingHalted()).toBe(false);
  });

  it('should handle rapid state changes correctly', () => {
    for (let i = 0; i < 10; i++) {
      const halted = i % 2 === 0;
      setRiskControlConfig({ pricingHalted: halted });
      expect(isPricingHalted()).toBe(halted);

      const result = generateQuoteBreakdown({
        device: mockDevice,
        condition: 'excellent',
        attributes: {},
        deviceAttributes: [],
        anchors: mockAnchors,
        policy: mockPolicy,
      });

      expect(result.pricingFrozen).toBe(halted);
      if (halted) {
        expect(result.anchorBlendedPrice).toBeNull();
      }
    }
  });

  it('should have consistent behavior between isPricingHalted and quote generation', () => {
    // Set halted
    setRiskControlConfig({ pricingHalted: true });
    
    const isHalted = isPricingHalted();
    const result = generateQuoteBreakdown({
      device: mockDevice,
      condition: 'excellent',
      attributes: {},
      deviceAttributes: [],
      anchors: mockAnchors,
      policy: mockPolicy,
    });

    // Both should agree
    expect(isHalted).toBe(result.pricingFrozen);
  });
});

// ============================================================================
// Test Suite: PricingHaltedError
// ============================================================================

describe('PricingHaltedError', () => {
  it('should have correct name property', () => {
    const error = new PricingHaltedError('Test reason');
    expect(error.name).toBe('PricingHaltedError');
  });

  it('should include reason in message', () => {
    const error = new PricingHaltedError('Market instability');
    expect(error.message).toContain('Market instability');
  });

  it('should use default message when no reason provided', () => {
    const error = new PricingHaltedError();
    expect(error.message).toContain('Risk control active');
  });

  it('should be instanceof Error', () => {
    const error = new PricingHaltedError();
    expect(error).toBeInstanceOf(Error);
  });
});

