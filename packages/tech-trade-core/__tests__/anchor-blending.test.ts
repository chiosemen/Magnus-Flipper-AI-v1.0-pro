/**
 * Anchor Blending Unit Tests
 * 
 * TDD: These tests are written BEFORE implementation.
 * Tests cover multi-source anchor weighting, fallbacks, and confidence scoring.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  blendAnchors,
  calculateAnchorConfidence,
  isAnchorStale,
  getAnchorsByCondition,
  redistributeWeights,
} from '../src/anchor-blending';
import type {
  MarketAnchor,
  PricingPolicy,
  Condition,
  AnchorBlendResult,
} from '../src/types';

// ============================================================================
// Test Fixtures
// ============================================================================

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

const deviceId = '550e8400-e29b-41d4-a716-446655440000';

function createAnchor(overrides: Partial<MarketAnchor> = {}): MarketAnchor {
  return {
    id: 'anchor-' + Math.random().toString(36).slice(2),
    deviceId,
    source: 'cex',
    condition: 'excellent',
    price: 380,
    url: 'https://example.com',
    scrapedAt: new Date(),
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: 'admin-1',
    version: 1,
    createdAt: new Date(),
    ...overrides,
  };
}

const freshDate = new Date();
const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

// ============================================================================
// Multi-Source Anchor Weighting Tests
// ============================================================================

describe('blendAnchors', () => {
  it('should blend two sources with 40/40/20 weighting', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380 }),
      createAnchor({ source: 'back_market', price: 400 }),
    ];
    const policyPrice = 382.50;

    const result = blendAnchors(anchors, policyPrice, mockPolicy);

    // CeX: 380 * 0.40 = 152
    // Back Market: 400 * 0.40 = 160
    // Policy: 382.50 * 0.20 = 76.50
    // Total: 388.50
    expect(result.blendedPrice).toBeCloseTo(388.50, 2);
    expect(result.anchorsUsed).toHaveLength(2);
  });

  it('should handle single CeX source with redistributed weights', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380 }),
    ];
    const policyPrice = 382.50;

    const result = blendAnchors(anchors, policyPrice, mockPolicy);

    // Only CeX available, so weights redistribute:
    // CeX gets 0.40 / (0.40 + 0.20) = 0.667
    // Policy gets 0.20 / (0.40 + 0.20) = 0.333
    // Blended: 380 * 0.667 + 382.50 * 0.333 = 253.46 + 127.37 = 380.83
    expect(result.blendedPrice).toBeCloseTo(380.83, 1);
    expect(result.warnings).toContain('Missing anchor source: back_market');
  });

  it('should handle single Back Market source with redistributed weights', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'back_market', price: 400 }),
    ];
    const policyPrice = 382.50;

    const result = blendAnchors(anchors, policyPrice, mockPolicy);

    expect(result.blendedPrice).not.toBeNull();
    expect(result.warnings).toContain('Missing anchor source: cex');
  });

  it('should use average when multiple anchors from same source', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 370 }),
      createAnchor({ source: 'cex', price: 390 }),
      createAnchor({ source: 'back_market', price: 400 }),
    ];
    const policyPrice = 382.50;

    const result = blendAnchors(anchors, policyPrice, mockPolicy);

    // CeX average: (370 + 390) / 2 = 380
    // Same calculation as first test
    expect(result.blendedPrice).toBeCloseTo(388.50, 2);
  });

  it('should filter anchors by condition', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, condition: 'excellent' }),
      createAnchor({ source: 'cex', price: 300, condition: 'good' }), // Different condition
      createAnchor({ source: 'back_market', price: 400, condition: 'excellent' }),
    ];
    const policyPrice = 382.50;

    const result = blendAnchors(anchors, policyPrice, mockPolicy, 'excellent');

    // Should only use excellent condition anchors
    expect(result.anchorsUsed).toHaveLength(2);
    expect(result.blendedPrice).toBeCloseTo(388.50, 2);
  });
});

// ============================================================================
// Missing Anchor Fallback Tests
// ============================================================================

describe('Missing Anchor Fallback', () => {
  it('should return null blendedPrice when no anchors available', () => {
    const result = blendAnchors([], 382.50, mockPolicy);

    expect(result.blendedPrice).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.warnings).toContain('No approved anchors available');
  });

  it('should return null when all anchors are stale', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: staleDate }),
      createAnchor({ source: 'back_market', price: 400, scrapedAt: staleDate }),
    ];

    const result = blendAnchors(anchors, 382.50, mockPolicy);

    expect(result.blendedPrice).toBeNull();
    expect(result.warnings).toContain('All anchors are stale');
  });

  it('should filter out stale anchors and use fresh ones', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: freshDate }),
      createAnchor({ source: 'cex', price: 300, scrapedAt: staleDate }), // Stale
      createAnchor({ source: 'back_market', price: 400, scrapedAt: freshDate }),
    ];

    const result = blendAnchors(anchors, 382.50, mockPolicy);

    expect(result.anchorsUsed).toHaveLength(2);
    expect(result.blendedPrice).toBeCloseTo(388.50, 2);
  });

  it('should add warning when some anchors are stale', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: freshDate }),
      createAnchor({ source: 'back_market', price: 400, scrapedAt: staleDate }),
    ];

    const result = blendAnchors(anchors, 382.50, mockPolicy);

    expect(result.warnings).toContain('Some anchors were filtered due to staleness');
  });
});

// ============================================================================
// Stale Anchor Detection Tests
// ============================================================================

describe('isAnchorStale', () => {
  it('should return false for fresh anchor (within max age)', () => {
    const anchor = createAnchor({ scrapedAt: new Date() });
    expect(isAnchorStale(anchor, mockPolicy)).toBe(false);
  });

  it('should return true for anchor older than max age', () => {
    const anchor = createAnchor({ scrapedAt: staleDate });
    expect(isAnchorStale(anchor, mockPolicy)).toBe(true);
  });

  it('should return false for anchor exactly at max age boundary', () => {
    const boundaryDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const anchor = createAnchor({ scrapedAt: boundaryDate });
    expect(isAnchorStale(anchor, mockPolicy)).toBe(false);
  });

  it('should use custom max age from policy', () => {
    const customPolicy = { ...mockPolicy, anchorMaxAgeDays: 3 };
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const anchor = createAnchor({ scrapedAt: fourDaysAgo });
    
    expect(isAnchorStale(anchor, customPolicy)).toBe(true);
    expect(isAnchorStale(anchor, mockPolicy)).toBe(false); // 7 day policy
  });
});

// ============================================================================
// Confidence Scoring Tests
// ============================================================================

describe('calculateAnchorConfidence', () => {
  it('should return 1.0 for fresh, agreeing anchors from both sources', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: freshDate }),
      createAnchor({ source: 'back_market', price: 382, scrapedAt: freshDate }),
    ];

    const confidence = calculateAnchorConfidence(anchors, mockPolicy);

    // High freshness (1.0) + high agreement (prices close) + full coverage (both sources)
    expect(confidence).toBeGreaterThan(0.9);
  });

  it('should return 0 when no anchors available', () => {
    const confidence = calculateAnchorConfidence([], mockPolicy);
    expect(confidence).toBe(0);
  });

  it('should penalize stale anchors', () => {
    const freshAnchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: freshDate }),
      createAnchor({ source: 'back_market', price: 382, scrapedAt: freshDate }),
    ];

    const mixedAnchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: freshDate }),
      createAnchor({ source: 'back_market', price: 382, scrapedAt: staleDate }),
    ];

    const freshConfidence = calculateAnchorConfidence(freshAnchors, mockPolicy);
    const mixedConfidence = calculateAnchorConfidence(mixedAnchors, mockPolicy);

    expect(mixedConfidence).toBeLessThan(freshConfidence);
  });

  it('should penalize disagreeing prices', () => {
    const agreeingAnchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: freshDate }),
      createAnchor({ source: 'back_market', price: 382, scrapedAt: freshDate }),
    ];

    const disagreeingAnchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 300, scrapedAt: freshDate }),
      createAnchor({ source: 'back_market', price: 450, scrapedAt: freshDate }),
    ];

    const agreeingConfidence = calculateAnchorConfidence(agreeingAnchors, mockPolicy);
    const disagreeingConfidence = calculateAnchorConfidence(disagreeingAnchors, mockPolicy);

    expect(disagreeingConfidence).toBeLessThan(agreeingConfidence);
  });

  it('should penalize missing sources', () => {
    const bothSources: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: freshDate }),
      createAnchor({ source: 'back_market', price: 382, scrapedAt: freshDate }),
    ];

    const oneSource: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: freshDate }),
    ];

    const bothConfidence = calculateAnchorConfidence(bothSources, mockPolicy);
    const oneConfidence = calculateAnchorConfidence(oneSource, mockPolicy);

    expect(oneConfidence).toBeLessThan(bothConfidence);
  });

  it('should return confidence between 0 and 1', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: freshDate }),
    ];

    const confidence = calculateAnchorConfidence(anchors, mockPolicy);

    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('getAnchorsByCondition', () => {
  it('should filter anchors by condition', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ condition: 'new', price: 450 }),
      createAnchor({ condition: 'excellent', price: 380 }),
      createAnchor({ condition: 'good', price: 320 }),
      createAnchor({ condition: 'fair', price: 250 }),
    ];

    const excellent = getAnchorsByCondition(anchors, 'excellent');
    expect(excellent).toHaveLength(1);
    expect(excellent[0].price).toBe(380);
  });

  it('should return empty array when no matching condition', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ condition: 'new', price: 450 }),
    ];

    const fair = getAnchorsByCondition(anchors, 'fair');
    expect(fair).toHaveLength(0);
  });
});

describe('redistributeWeights', () => {
  it('should redistribute weights when one source missing', () => {
    const availableSources = ['cex'];
    const weights = redistributeWeights(availableSources, mockPolicy);

    // CeX: 0.40 / (0.40 + 0.20) = 0.667
    // Policy: 0.20 / (0.40 + 0.20) = 0.333
    expect(weights.cex).toBeCloseTo(0.667, 2);
    expect(weights.back_market).toBe(0);
    expect(weights.policy).toBeCloseTo(0.333, 2);
  });

  it('should maintain original weights when both sources available', () => {
    const availableSources = ['cex', 'back_market'];
    const weights = redistributeWeights(availableSources, mockPolicy);

    expect(weights.cex).toBe(0.40);
    expect(weights.back_market).toBe(0.40);
    expect(weights.policy).toBe(0.20);
  });

  it('should use 100% policy when no sources available', () => {
    const availableSources: string[] = [];
    const weights = redistributeWeights(availableSources, mockPolicy);

    expect(weights.cex).toBe(0);
    expect(weights.back_market).toBe(0);
    expect(weights.policy).toBe(1.0);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle anchors with zero price', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 0 }),
      createAnchor({ source: 'back_market', price: 400 }),
    ];

    const result = blendAnchors(anchors, 382.50, mockPolicy);

    // Zero price anchors should probably be filtered
    expect(result.warnings).toContain('Invalid anchor price detected');
  });

  it('should handle negative anchor prices', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: -50 }),
    ];

    const result = blendAnchors(anchors, 382.50, mockPolicy);

    expect(result.warnings).toContain('Invalid anchor price detected');
  });

  it('should handle very large price differences', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 100 }),
      createAnchor({ source: 'back_market', price: 1000 }),
    ];

    const result = blendAnchors(anchors, 382.50, mockPolicy);
    const confidence = calculateAnchorConfidence(anchors, mockPolicy);

    // Large price difference should result in reduced confidence
    // The formula penalizes high coefficient of variation
    expect(confidence).toBeLessThan(0.9);
  });

  it('should not produce NaN or Infinity', () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380 }),
    ];

    const result = blendAnchors(anchors, 382.50, mockPolicy);

    expect(Number.isFinite(result.blendedPrice)).toBe(true);
    expect(Number.isNaN(result.blendedPrice)).toBe(false);
    expect(Number.isFinite(result.confidence)).toBe(true);
  });
});

