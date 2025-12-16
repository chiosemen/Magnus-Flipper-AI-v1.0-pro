/**
 * Failure Modes Integration Tests
 * 
 * Tests graceful degradation and error handling:
 * - Missing anchors → fallback pricing
 * - Stale anchors → low confidence flag
 * - Device not found → error handling
 * - Partial data → graceful degradation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  blendAnchors,
  calculateAnchorConfidence,
  generateQuoteBreakdown,
  searchDevices,
  getDeviceById,
  validateDeviceAttributes,
  setDeviceRepository,
  enforceFloorPrice,
  enforceMarginRequirement,
} from '../../src';
import type {
  TechDevice,
  DeviceAttribute,
  MarketAnchor,
  PricingPolicy,
} from '../../src/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const testDevice: TechDevice = {
  id: '550e8400-e29b-41d4-a716-446655440001',
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

const testAttributes: DeviceAttribute[] = [
  { id: '1', deviceId: testDevice.id, attributeType: 'storage', attributeValue: '128GB', priceModifier: 0, createdAt: new Date() },
];

const testPolicy: PricingPolicy = {
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
// Mock Repository Setup
// ============================================================================

function setupMockRepository(devices: TechDevice[] = [testDevice]) {
  const mockRepo = {
    findMany: vi.fn(async (params) => {
      let result = [...devices];
      if (params?.where?.isActive !== undefined) {
        result = result.filter(d => d.isActive === params.where.isActive);
      }
      return result.map(d => ({
        ...d,
        attributes: testAttributes.filter(a => a.deviceId === d.id),
      }));
    }),
    findUnique: vi.fn(async (params) => {
      const device = devices.find(d => d.id === params.where.id);
      if (!device) return null;
      return {
        ...device,
        attributes: testAttributes.filter(a => a.deviceId === device.id),
      };
    }),
    count: vi.fn(async () => devices.length),
  };
  
  setDeviceRepository(mockRepo);
  return mockRepo;
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Failure Modes Integration', () => {
  describe('Missing Anchors → Fallback Pricing', () => {
    it('should use policy-only pricing when no anchors exist', () => {
      const result = blendAnchors([], 382.50, testPolicy, 'excellent');
      
      expect(result.blendedPrice).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.warnings).toContain('No approved anchors available');
    });

    it('should generate valid quote without anchors', () => {
      const breakdown = generateQuoteBreakdown({
        device: testDevice,
        condition: 'excellent',
        attributes: {},
        deviceAttributes: testAttributes,
        anchors: [],
        policy: testPolicy,
      });
      
      // Should fall back to policy-only pricing
      expect(breakdown.anchorBlendedPrice).toBeNull();
      expect(breakdown.finalPrice).toBe(382.50); // Base * 0.85
    });

    it('should use policy-only when only one source available', () => {
      const singleAnchor: MarketAnchor = {
        id: 'anchor-1',
        deviceId: testDevice.id,
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
      };
      
      const result = blendAnchors([singleAnchor], 382.50, testPolicy, 'excellent');
      
      // Should work with redistributed weights
      expect(result.blendedPrice).not.toBeNull();
      expect(result.warnings).toContain('Missing anchor source: back_market');
    });
  });

  describe('Stale Anchors → Low Confidence Flag', () => {
    it('should flag low confidence for stale anchors', () => {
      const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      
      const staleAnchors: MarketAnchor[] = [
        {
          id: 'anchor-1',
          deviceId: testDevice.id,
          source: 'cex',
          condition: 'excellent',
          price: 380,
          url: null,
          scrapedAt: staleDate,
          status: 'approved',
          approvedAt: staleDate,
          approvedBy: 'admin-1',
          version: 1,
          createdAt: staleDate,
        },
      ];
      
      const confidence = calculateAnchorConfidence(staleAnchors, testPolicy);
      
      // Stale anchors should have lower confidence
      expect(confidence).toBeLessThan(0.8);
    });

    it('should filter stale anchors and warn', () => {
      const freshDate = new Date();
      const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      
      const mixedAnchors: MarketAnchor[] = [
        {
          id: 'anchor-fresh',
          deviceId: testDevice.id,
          source: 'cex',
          condition: 'excellent',
          price: 380,
          url: null,
          scrapedAt: freshDate,
          status: 'approved',
          approvedAt: freshDate,
          approvedBy: 'admin-1',
          version: 1,
          createdAt: freshDate,
        },
        {
          id: 'anchor-stale',
          deviceId: testDevice.id,
          source: 'back_market',
          condition: 'excellent',
          price: 400,
          url: null,
          scrapedAt: staleDate,
          status: 'approved',
          approvedAt: staleDate,
          approvedBy: 'admin-1',
          version: 1,
          createdAt: staleDate,
        },
      ];
      
      const result = blendAnchors(mixedAnchors, 382.50, testPolicy, 'excellent');
      
      expect(result.anchorsUsed).toHaveLength(1);
      expect(result.warnings).toContain('Some anchors were filtered due to staleness');
    });

    it('should return null when all anchors are stale', () => {
      const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      
      const allStale: MarketAnchor[] = [
        {
          id: 'anchor-1',
          deviceId: testDevice.id,
          source: 'cex',
          condition: 'excellent',
          price: 380,
          url: null,
          scrapedAt: staleDate,
          status: 'approved',
          approvedAt: staleDate,
          approvedBy: 'admin-1',
          version: 1,
          createdAt: staleDate,
        },
        {
          id: 'anchor-2',
          deviceId: testDevice.id,
          source: 'back_market',
          condition: 'excellent',
          price: 400,
          url: null,
          scrapedAt: staleDate,
          status: 'approved',
          approvedAt: staleDate,
          approvedBy: 'admin-1',
          version: 1,
          createdAt: staleDate,
        },
      ];
      
      const result = blendAnchors(allStale, 382.50, testPolicy, 'excellent');
      
      expect(result.blendedPrice).toBeNull();
      expect(result.warnings).toContain('All anchors are stale');
    });
  });

  describe('Device Not Found → Error Handling', () => {
    beforeEach(() => {
      setupMockRepository([testDevice]);
    });

    it('should return null for non-existent device', async () => {
      const device = await getDeviceById('00000000-0000-0000-0000-000000000000');
      expect(device).toBeNull();
    });

    it('should throw for invalid UUID format', async () => {
      await expect(getDeviceById('not-a-uuid')).rejects.toThrow();
    });

    it('should return empty search results for no matches', async () => {
      const result = await searchDevices({ query: 'NonExistentDevice12345' });
      
      expect(result.devices).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should return false for attribute validation on non-existent device', async () => {
      const isValid = await validateDeviceAttributes(
        '00000000-0000-0000-0000-000000000000',
        { storage: '128GB' }
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe('Partial Data → Graceful Degradation', () => {
    it('should handle device with no attributes', async () => {
      const deviceWithNoAttrs: TechDevice = {
        ...testDevice,
        id: '550e8400-e29b-41d4-a716-446655440002',
      };
      
      setupMockRepository([deviceWithNoAttrs]);
      
      const device = await getDeviceById(deviceWithNoAttrs.id);
      expect(device).not.toBeNull();
      expect(device!.attributes).toHaveLength(0);
      
      // Should still generate valid quote
      const breakdown = generateQuoteBreakdown({
        device: device!,
        condition: 'excellent',
        attributes: {},
        deviceAttributes: [],
        anchors: [],
        policy: testPolicy,
      });
      
      expect(breakdown.attributeAdjustment).toBe(0);
      expect(breakdown.finalPrice).toBe(382.50);
    });

    it('should handle unknown attributes gracefully', () => {
      const breakdown = generateQuoteBreakdown({
        device: testDevice,
        condition: 'excellent',
        attributes: { unknownAttr: 'unknownValue' },
        deviceAttributes: testAttributes,
        anchors: [],
        policy: testPolicy,
      });
      
      // Unknown attributes should be ignored (0 adjustment)
      expect(breakdown.attributeAdjustment).toBe(0);
    });

    it('should handle anchors with invalid prices', () => {
      const invalidAnchors: MarketAnchor[] = [
        {
          id: 'anchor-zero',
          deviceId: testDevice.id,
          source: 'cex',
          condition: 'excellent',
          price: 0, // Invalid
          url: null,
          scrapedAt: new Date(),
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: 'admin-1',
          version: 1,
          createdAt: new Date(),
        },
        {
          id: 'anchor-negative',
          deviceId: testDevice.id,
          source: 'back_market',
          condition: 'excellent',
          price: -50, // Invalid
          url: null,
          scrapedAt: new Date(),
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: 'admin-1',
          version: 1,
          createdAt: new Date(),
        },
      ];
      
      const result = blendAnchors(invalidAnchors, 382.50, testPolicy, 'excellent');
      
      // Should filter out invalid prices
      expect(result.warnings).toContain('Invalid anchor price detected');
      expect(result.blendedPrice).toBeNull();
    });

    it('should enforce policy floor for very low prices', () => {
      // Device with very low base price
      const cheapDevice: TechDevice = {
        ...testDevice,
        basePrice: 15,
      };
      
      const breakdown = generateQuoteBreakdown({
        device: cheapDevice,
        condition: 'fair', // 50% multiplier
        attributes: {},
        deviceAttributes: [],
        anchors: [],
        policy: testPolicy,
      });
      
      // 15 * 0.50 = 7.50, but floor is 10
      expect(breakdown.afterCondition).toBe(7.50);
      expect(breakdown.finalPrice).toBe(10); // Raised to floor
      expect(breakdown.policyAdjustment).toBe(2.50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty attribute selection', async () => {
      setupMockRepository([testDevice]);
      
      const isValid = await validateDeviceAttributes(testDevice.id, {});
      expect(isValid).toBe(true);
    });

    it('should handle very long search queries', async () => {
      setupMockRepository([testDevice]);
      
      const longQuery = 'a'.repeat(1000);
      const result = await searchDevices({ query: longQuery });
      
      // Should not throw, should return empty
      expect(result.devices).toHaveLength(0);
    });

    it('should handle pagination edge cases', async () => {
      setupMockRepository([testDevice]);
      
      // Page beyond total
      const result = await searchDevices({ page: 9999, limit: 10 });
      expect(result.devices).toHaveLength(0);
      expect(result.pagination.page).toBe(9999);
    });

    it('should not produce NaN or Infinity in calculations', () => {
      const breakdown = generateQuoteBreakdown({
        device: testDevice,
        condition: 'excellent',
        attributes: {},
        deviceAttributes: [],
        anchors: [],
        policy: testPolicy,
      });
      
      expect(Number.isFinite(breakdown.basePrice)).toBe(true);
      expect(Number.isFinite(breakdown.finalPrice)).toBe(true);
      expect(Number.isNaN(breakdown.finalPrice)).toBe(false);
    });

    it('should handle zero base price device', () => {
      const freeDevice: TechDevice = {
        ...testDevice,
        basePrice: 0,
      };
      
      const breakdown = generateQuoteBreakdown({
        device: freeDevice,
        condition: 'excellent',
        attributes: {},
        deviceAttributes: [],
        anchors: [],
        policy: testPolicy,
      });
      
      // Should be raised to floor
      expect(breakdown.afterCondition).toBe(0);
      expect(breakdown.finalPrice).toBe(10); // Floor
    });

    it('should handle policy enforcement edge cases', () => {
      // Test floor enforcement
      expect(enforceFloorPrice(-100, testPolicy)).toBe(10);
      expect(enforceFloorPrice(NaN, testPolicy)).toBe(10);
      
      // Test margin enforcement
      expect(enforceMarginRequirement(50, 0, testPolicy)).toBe(50); // No cost
      expect(enforceMarginRequirement(50, undefined, testPolicy)).toBe(50); // Undefined cost
    });
  });
});

