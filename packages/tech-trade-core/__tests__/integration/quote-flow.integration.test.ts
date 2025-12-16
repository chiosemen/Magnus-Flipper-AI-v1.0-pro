/**
 * Quote Flow Integration Tests
 * 
 * End-to-end tests for B2C quote generation flow:
 * - Device search → quote request → response
 * - Quote persistence and retrieval
 * - Audit trail validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  searchDevices,
  getDeviceById,
  validateDeviceAttributes,
  generateQuoteBreakdown,
  setDeviceRepository,
} from '../../src';
import type {
  TechDevice,
  DeviceAttribute,
  PricingPolicy,
  MarketAnchor,
  QuoteBreakdown,
} from '../../src/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const testDevices: TechDevice[] = [
  {
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
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    brand: 'Samsung',
    model: 'Galaxy S22',
    category: 'smartphone',
    releaseYear: 2022,
    basePrice: 400.00,
    currency: 'GBP',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const testAttributes: DeviceAttribute[] = [
  { id: '1', deviceId: testDevices[0].id, attributeType: 'storage', attributeValue: '64GB', priceModifier: -25, createdAt: new Date() },
  { id: '2', deviceId: testDevices[0].id, attributeType: 'storage', attributeValue: '128GB', priceModifier: 0, createdAt: new Date() },
  { id: '3', deviceId: testDevices[0].id, attributeType: 'storage', attributeValue: '256GB', priceModifier: 30, createdAt: new Date() },
  { id: '4', deviceId: testDevices[0].id, attributeType: 'color', attributeValue: 'Midnight', priceModifier: 0, createdAt: new Date() },
  { id: '5', deviceId: testDevices[0].id, attributeType: 'carrier', attributeValue: 'Unlocked', priceModifier: 0, createdAt: new Date() },
  { id: '6', deviceId: testDevices[0].id, attributeType: 'carrier', attributeValue: 'EE', priceModifier: -40, createdAt: new Date() },
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

function setupTestRepository() {
  const mockRepo = {
    findMany: vi.fn(async (params) => {
      let devices = [...testDevices];
      
      if (params?.where?.isActive !== undefined) {
        devices = devices.filter(d => d.isActive === params.where.isActive);
      }
      if (params?.where?.brand) {
        devices = devices.filter(d => d.brand === params.where.brand);
      }
      if (params?.where?.category) {
        devices = devices.filter(d => d.category === params.where.category);
      }
      
      return devices.map(d => ({
        ...d,
        attributes: testAttributes.filter(a => a.deviceId === d.id),
      }));
    }),
    findUnique: vi.fn(async (params) => {
      const device = testDevices.find(d => d.id === params.where.id);
      if (!device) return null;
      return {
        ...device,
        attributes: testAttributes.filter(a => a.deviceId === device.id),
      };
    }),
    count: vi.fn(async () => testDevices.length),
  };
  
  setDeviceRepository(mockRepo);
  return mockRepo;
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Quote Flow Integration', () => {
  beforeEach(() => {
    setupTestRepository();
  });

  describe('Device Search → Quote Request → Response', () => {
    it('should complete full quote flow for iPhone 13', async () => {
      // Step 1: Search for device
      const searchResult = await searchDevices({ query: 'iPhone 13' });
      expect(searchResult.devices.length).toBeGreaterThan(0);
      
      const device = searchResult.devices.find(d => d.model === 'iPhone 13');
      expect(device).toBeDefined();
      expect(device!.brand).toBe('Apple');
      
      // Step 2: Verify device has attributes
      expect(device!.attributes.length).toBeGreaterThan(0);
      const storageAttr = device!.attributes.find(a => a.type === 'storage');
      expect(storageAttr).toBeDefined();
      expect(storageAttr!.values).toContain('128GB');
      
      // Step 3: Validate selected attributes
      const selectedAttrs = { storage: '128GB', color: 'Midnight', carrier: 'Unlocked' };
      const isValid = await validateDeviceAttributes(device!.id, selectedAttrs);
      expect(isValid).toBe(true);
      
      // Step 4: Generate quote
      const fullDevice = await getDeviceById(device!.id);
      expect(fullDevice).not.toBeNull();
      
      const breakdown = generateQuoteBreakdown({
        device: fullDevice!,
        condition: 'excellent',
        attributes: selectedAttrs,
        deviceAttributes: testAttributes.filter(a => a.deviceId === device!.id),
        anchors: [],
        policy: testPolicy,
      });
      
      // Step 5: Verify quote breakdown
      expect(breakdown.basePrice).toBe(450.00);
      expect(breakdown.conditionMultiplier).toBe(0.85);
      expect(breakdown.afterCondition).toBe(382.50);
      expect(breakdown.attributeAdjustment).toBe(0); // 128GB = 0, Midnight = 0, Unlocked = 0
      expect(breakdown.afterAttributes).toBe(382.50);
      expect(breakdown.finalPrice).toBe(382.50);
    });

    it('should apply negative attribute adjustments correctly', async () => {
      const device = await getDeviceById(testDevices[0].id);
      expect(device).not.toBeNull();
      
      // Select lower storage and carrier-locked
      const selectedAttrs = { storage: '64GB', carrier: 'EE' };
      
      const breakdown = generateQuoteBreakdown({
        device: device!,
        condition: 'good',
        attributes: selectedAttrs,
        deviceAttributes: testAttributes,
        anchors: [],
        policy: testPolicy,
      });
      
      // Base: 450, Good: 70%, After condition: 315
      // Attributes: -25 (64GB) + -40 (EE) = -65
      // After attributes: 315 - 65 = 250
      expect(breakdown.afterCondition).toBe(315.00);
      expect(breakdown.attributeAdjustment).toBe(-65);
      expect(breakdown.afterAttributes).toBe(250.00);
      expect(breakdown.finalPrice).toBe(250.00);
    });

    it('should apply positive attribute adjustments correctly', async () => {
      const device = await getDeviceById(testDevices[0].id);
      expect(device).not.toBeNull();
      
      // Select higher storage
      const selectedAttrs = { storage: '256GB' };
      
      const breakdown = generateQuoteBreakdown({
        device: device!,
        condition: 'excellent',
        attributes: selectedAttrs,
        deviceAttributes: testAttributes,
        anchors: [],
        policy: testPolicy,
      });
      
      // Base: 450, Excellent: 85%, After condition: 382.50
      // Attributes: +30 (256GB)
      // After attributes: 382.50 + 30 = 412.50
      expect(breakdown.afterCondition).toBe(382.50);
      expect(breakdown.attributeAdjustment).toBe(30);
      expect(breakdown.afterAttributes).toBe(412.50);
      expect(breakdown.finalPrice).toBe(412.50);
    });
  });

  describe('Quote Persistence', () => {
    it('should generate quote with all required fields for persistence', async () => {
      const device = await getDeviceById(testDevices[0].id);
      const selectedAttrs = { storage: '128GB' };
      
      const breakdown = generateQuoteBreakdown({
        device: device!,
        condition: 'excellent',
        attributes: selectedAttrs,
        deviceAttributes: testAttributes,
        anchors: [],
        policy: testPolicy,
      });
      
      // Verify all fields needed for DeviceQuote are present
      expect(breakdown).toHaveProperty('basePrice');
      expect(breakdown).toHaveProperty('conditionMultiplier');
      expect(breakdown).toHaveProperty('attributeAdjustment');
      expect(breakdown).toHaveProperty('anchorBlendedPrice');
      expect(breakdown).toHaveProperty('policyAdjustment');
      expect(breakdown).toHaveProperty('finalPrice');
      
      // All numeric values should be finite
      expect(Number.isFinite(breakdown.basePrice)).toBe(true);
      expect(Number.isFinite(breakdown.conditionMultiplier)).toBe(true);
      expect(Number.isFinite(breakdown.attributeAdjustment)).toBe(true);
      expect(Number.isFinite(breakdown.policyAdjustment)).toBe(true);
      expect(Number.isFinite(breakdown.finalPrice)).toBe(true);
    });

    it('should include anchor snapshot when anchors are used', async () => {
      const device = await getDeviceById(testDevices[0].id);
      
      const testAnchors: MarketAnchor[] = [
        {
          id: 'anchor-1',
          deviceId: device!.id,
          source: 'cex',
          condition: 'excellent',
          price: 380,
          url: 'https://cex.com/iphone13',
          scrapedAt: new Date(),
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: 'admin-1',
          version: 1,
          createdAt: new Date(),
        },
      ];
      
      const breakdown = generateQuoteBreakdown({
        device: device!,
        condition: 'excellent',
        attributes: {},
        deviceAttributes: testAttributes,
        anchors: testAnchors,
        policy: testPolicy,
      });
      
      // Anchor should influence the price
      expect(breakdown.anchorBlendedPrice).not.toBeNull();
    });
  });

  describe('Audit Trail Validation', () => {
    it('should produce deterministic results for same inputs', async () => {
      const device = await getDeviceById(testDevices[0].id);
      const selectedAttrs = { storage: '128GB', carrier: 'Unlocked' };
      
      const breakdown1 = generateQuoteBreakdown({
        device: device!,
        condition: 'excellent',
        attributes: selectedAttrs,
        deviceAttributes: testAttributes,
        anchors: [],
        policy: testPolicy,
      });
      
      const breakdown2 = generateQuoteBreakdown({
        device: device!,
        condition: 'excellent',
        attributes: selectedAttrs,
        deviceAttributes: testAttributes,
        anchors: [],
        policy: testPolicy,
      });
      
      // Results should be identical
      expect(breakdown1.finalPrice).toBe(breakdown2.finalPrice);
      expect(breakdown1.basePrice).toBe(breakdown2.basePrice);
      expect(breakdown1.conditionMultiplier).toBe(breakdown2.conditionMultiplier);
      expect(breakdown1.attributeAdjustment).toBe(breakdown2.attributeAdjustment);
    });

    it('should produce different results for different conditions', async () => {
      const device = await getDeviceById(testDevices[0].id);
      
      const excellentBreakdown = generateQuoteBreakdown({
        device: device!,
        condition: 'excellent',
        attributes: {},
        deviceAttributes: testAttributes,
        anchors: [],
        policy: testPolicy,
      });
      
      const fairBreakdown = generateQuoteBreakdown({
        device: device!,
        condition: 'fair',
        attributes: {},
        deviceAttributes: testAttributes,
        anchors: [],
        policy: testPolicy,
      });
      
      // Fair should be significantly lower
      expect(fairBreakdown.finalPrice).toBeLessThan(excellentBreakdown.finalPrice);
      expect(fairBreakdown.conditionMultiplier).toBe(0.50);
      expect(excellentBreakdown.conditionMultiplier).toBe(0.85);
    });
  });
});

