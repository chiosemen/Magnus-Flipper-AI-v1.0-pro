/**
 * Market Signal Pipeline Integration Tests
 * 
 * Tests the flow from scraper → anchor storage → approval → pricing engine usage.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  blendAnchors,
  calculateAnchorConfidence,
  isAnchorStale,
  generateQuoteBreakdown,
} from '../../src';
import type {
  TechDevice,
  DeviceAttribute,
  MarketAnchor,
  PricingPolicy,
  RawAnchor,
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
// Helper Functions
// ============================================================================

/**
 * Simulate scraper writing raw anchor data
 */
function simulateScrape(device: TechDevice, source: 'cex' | 'back_market', price: number): RawAnchor {
  return {
    deviceBrand: device.brand,
    deviceModel: device.model,
    source,
    condition: 'excellent',
    price,
    currency: 'GBP',
    url: `https://${source}.com/${device.model.toLowerCase().replace(' ', '-')}`,
    scrapedAt: new Date(),
  };
}

/**
 * Simulate anchor storage (pending status)
 */
function storeAnchor(raw: RawAnchor, deviceId: string): MarketAnchor {
  return {
    id: `anchor-${Math.random().toString(36).slice(2)}`,
    deviceId,
    source: raw.source,
    condition: raw.condition,
    price: raw.price,
    url: raw.url,
    scrapedAt: raw.scrapedAt,
    status: 'pending',
    approvedAt: null,
    approvedBy: null,
    version: 0,
    createdAt: new Date(),
  };
}

/**
 * Simulate admin approval
 */
function approveAnchor(anchor: MarketAnchor, adminId: string): MarketAnchor {
  return {
    ...anchor,
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: adminId,
    version: anchor.version + 1,
  };
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Market Signal Pipeline Integration', () => {
  describe('Scraper → Anchor Storage → Approval → Pricing', () => {
    it('should complete full pipeline from scrape to quote', async () => {
      // Step 1: Simulate scraping CeX and Back Market
      const cexRaw = simulateScrape(testDevice, 'cex', 380);
      const backMarketRaw = simulateScrape(testDevice, 'back_market', 400);
      
      expect(cexRaw.source).toBe('cex');
      expect(backMarketRaw.source).toBe('back_market');
      
      // Step 2: Store as pending anchors
      const cexAnchor = storeAnchor(cexRaw, testDevice.id);
      const backMarketAnchor = storeAnchor(backMarketRaw, testDevice.id);
      
      expect(cexAnchor.status).toBe('pending');
      expect(backMarketAnchor.status).toBe('pending');
      
      // Step 3: Pending anchors should NOT be used in pricing
      const pendingResult = blendAnchors(
        [cexAnchor, backMarketAnchor],
        382.50,
        testPolicy,
        'excellent'
      );
      
      expect(pendingResult.blendedPrice).toBeNull();
      expect(pendingResult.warnings).toContain('No approved anchors available');
      
      // Step 4: Admin approves anchors
      const approvedCex = approveAnchor(cexAnchor, 'admin-1');
      const approvedBackMarket = approveAnchor(backMarketAnchor, 'admin-1');
      
      expect(approvedCex.status).toBe('approved');
      expect(approvedCex.approvedBy).toBe('admin-1');
      expect(approvedCex.version).toBe(1);
      
      // Step 5: Approved anchors SHOULD be used in pricing
      const approvedResult = blendAnchors(
        [approvedCex, approvedBackMarket],
        382.50,
        testPolicy,
        'excellent'
      );
      
      expect(approvedResult.blendedPrice).not.toBeNull();
      expect(approvedResult.anchorsUsed).toHaveLength(2);
      
      // Step 6: Verify blended price calculation
      // CeX: 380 * 0.40 = 152
      // Back Market: 400 * 0.40 = 160
      // Policy: 382.50 * 0.20 = 76.50
      // Total: 388.50
      expect(approvedResult.blendedPrice).toBeCloseTo(388.50, 2);
      
      // Step 7: Generate full quote with anchors
      const breakdown = generateQuoteBreakdown({
        device: testDevice,
        condition: 'excellent',
        attributes: {},
        deviceAttributes: [],
        anchors: [approvedCex, approvedBackMarket],
        policy: testPolicy,
      });
      
      expect(breakdown.anchorBlendedPrice).toBeCloseTo(388.50, 2);
      expect(breakdown.finalPrice).toBeCloseTo(388.50, 2);
    });

    it('should reflect market signal in final quote', async () => {
      // Market prices are lower than policy price
      const lowCex = approveAnchor(
        storeAnchor(simulateScrape(testDevice, 'cex', 350), testDevice.id),
        'admin-1'
      );
      const lowBackMarket = approveAnchor(
        storeAnchor(simulateScrape(testDevice, 'back_market', 360), testDevice.id),
        'admin-1'
      );
      
      const policyPrice = 382.50; // Base * excellent multiplier
      
      const result = blendAnchors(
        [lowCex, lowBackMarket],
        policyPrice,
        testPolicy,
        'excellent'
      );
      
      // Blended price should be lower than policy-only price
      // CeX: 350 * 0.40 = 140
      // Back Market: 360 * 0.40 = 144
      // Policy: 382.50 * 0.20 = 76.50
      // Total: 360.50
      expect(result.blendedPrice).toBeCloseTo(360.50, 2);
      expect(result.blendedPrice!).toBeLessThan(policyPrice);
    });

    it('should handle market prices higher than policy', async () => {
      // Market prices are higher than policy price
      const highCex = approveAnchor(
        storeAnchor(simulateScrape(testDevice, 'cex', 420), testDevice.id),
        'admin-1'
      );
      const highBackMarket = approveAnchor(
        storeAnchor(simulateScrape(testDevice, 'back_market', 430), testDevice.id),
        'admin-1'
      );
      
      const policyPrice = 382.50;
      
      const result = blendAnchors(
        [highCex, highBackMarket],
        policyPrice,
        testPolicy,
        'excellent'
      );
      
      // Blended price should be higher than policy-only price
      // CeX: 420 * 0.40 = 168
      // Back Market: 430 * 0.40 = 172
      // Policy: 382.50 * 0.20 = 76.50
      // Total: 416.50
      expect(result.blendedPrice).toBeCloseTo(416.50, 2);
      expect(result.blendedPrice!).toBeGreaterThan(policyPrice);
    });
  });

  describe('Anchor Freshness Handling', () => {
    it('should filter stale anchors from pricing', async () => {
      const freshDate = new Date();
      const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      
      const freshAnchor: MarketAnchor = {
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
      };
      
      const staleAnchor: MarketAnchor = {
        id: 'anchor-stale',
        deviceId: testDevice.id,
        source: 'back_market',
        condition: 'excellent',
        price: 500, // Very different price
        url: null,
        scrapedAt: staleDate,
        status: 'approved',
        approvedAt: staleDate,
        approvedBy: 'admin-1',
        version: 1,
        createdAt: staleDate,
      };
      
      // Verify staleness detection
      expect(isAnchorStale(freshAnchor, testPolicy)).toBe(false);
      expect(isAnchorStale(staleAnchor, testPolicy)).toBe(true);
      
      // Blend should only use fresh anchor
      const result = blendAnchors(
        [freshAnchor, staleAnchor],
        382.50,
        testPolicy,
        'excellent'
      );
      
      expect(result.anchorsUsed).toHaveLength(1);
      expect(result.anchorsUsed[0].id).toBe('anchor-fresh');
      expect(result.warnings).toContain('Some anchors were filtered due to staleness');
      expect(result.warnings).toContain('Missing anchor source: back_market');
    });

    it('should return null when all anchors are stale', async () => {
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
      
      const result = blendAnchors(staleAnchors, 382.50, testPolicy, 'excellent');
      
      expect(result.blendedPrice).toBeNull();
      expect(result.warnings).toContain('All anchors are stale');
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence with fresh, agreeing anchors', async () => {
      const freshDate = new Date();
      
      const anchors: MarketAnchor[] = [
        {
          id: 'anchor-1',
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
          id: 'anchor-2',
          deviceId: testDevice.id,
          source: 'back_market',
          condition: 'excellent',
          price: 382, // Very close to CeX
          url: null,
          scrapedAt: freshDate,
          status: 'approved',
          approvedAt: freshDate,
          approvedBy: 'admin-1',
          version: 1,
          createdAt: freshDate,
        },
      ];
      
      const confidence = calculateAnchorConfidence(anchors, testPolicy);
      
      // Should have high confidence (> 0.9)
      expect(confidence).toBeGreaterThan(0.9);
    });

    it('should have lower confidence with disagreeing prices', async () => {
      const freshDate = new Date();
      
      const disagreeingAnchors: MarketAnchor[] = [
        {
          id: 'anchor-1',
          deviceId: testDevice.id,
          source: 'cex',
          condition: 'excellent',
          price: 300, // Low
          url: null,
          scrapedAt: freshDate,
          status: 'approved',
          approvedAt: freshDate,
          approvedBy: 'admin-1',
          version: 1,
          createdAt: freshDate,
        },
        {
          id: 'anchor-2',
          deviceId: testDevice.id,
          source: 'back_market',
          condition: 'excellent',
          price: 450, // High - 50% difference
          url: null,
          scrapedAt: freshDate,
          status: 'approved',
          approvedAt: freshDate,
          approvedBy: 'admin-1',
          version: 1,
          createdAt: freshDate,
        },
      ];
      
      const agreeingAnchors: MarketAnchor[] = [
        { ...disagreeingAnchors[0], price: 380 },
        { ...disagreeingAnchors[1], price: 382 },
      ];
      
      const disagreeingConfidence = calculateAnchorConfidence(disagreeingAnchors, testPolicy);
      const agreeingConfidence = calculateAnchorConfidence(agreeingAnchors, testPolicy);
      
      expect(disagreeingConfidence).toBeLessThan(agreeingConfidence);
    });
  });
});

