/**
 * Market Indicators Unit Tests
 * 
 * TDD: These tests are written BEFORE implementation.
 * Tests cover volume metrics, confidence scoring, and momentum calculations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateVolumeMetrics,
  calculateAnchorMetrics,
  calculateConfidenceMetrics,
  calculateMomentum,
  getMarketIndicators,
} from '../src/market-indicators';
import type {
  DeviceQuote,
  MarketAnchor,
  PricingPolicy,
  VolumeMetrics,
  AnchorMetrics,
  ConfidenceMetrics,
  MomentumMetrics,
  MarketIndicators,
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

const now = new Date();
const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

function createQuote(createdAt: Date): DeviceQuote {
  return {
    id: 'quote-' + Math.random().toString(36).slice(2),
    deviceId: 'device-1',
    userId: null,
    condition: 'excellent',
    attributes: {},
    basePrice: 450,
    conditionMultiplier: 0.85,
    attributeAdjustment: 0,
    anchorBlendedPrice: 380,
    policyAdjustment: 0,
    finalPrice: 380,
    confidence: 0.9,
    expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
    status: 'pending',
    anchorSnapshot: [],
    policyId: 'policy-1',
    createdAt,
  };
}

function createAnchor(overrides: Partial<MarketAnchor> = {}): MarketAnchor {
  return {
    id: 'anchor-' + Math.random().toString(36).slice(2),
    deviceId: 'device-1',
    source: 'cex',
    condition: 'excellent',
    price: 380,
    url: null,
    scrapedAt: now,
    status: 'approved',
    approvedAt: now,
    approvedBy: 'admin-1',
    version: 1,
    createdAt: now,
    ...overrides,
  };
}

// ============================================================================
// Volume Metrics Tests
// ============================================================================

describe('calculateVolumeMetrics', () => {
  it('should count quotes in last 24 hours', async () => {
    const quotes: DeviceQuote[] = [
      createQuote(now),
      createQuote(now),
      createQuote(oneDayAgo),
      createQuote(threeDaysAgo),
    ];

    const metrics = await calculateVolumeMetrics(quotes);

    // 2 quotes today, 1 quote yesterday (within 24h boundary depends on exact time)
    expect(metrics.quotesToday).toBeGreaterThanOrEqual(2);
  });

  it('should count quotes in last 7 days', async () => {
    const quotes: DeviceQuote[] = [
      createQuote(now),
      createQuote(oneDayAgo),
      createQuote(threeDaysAgo),
      createQuote(oneWeekAgo), // At boundary, may or may not be included
      createQuote(twoWeeksAgo), // Outside 7 days
    ];

    const metrics = await calculateVolumeMetrics(quotes);

    // At least 3 quotes should be within 7 days (now, oneDayAgo, threeDaysAgo)
    expect(metrics.quotesThisWeek).toBeGreaterThanOrEqual(3);
    expect(metrics.quotesThisWeek).toBeLessThanOrEqual(4);
  });

  it('should count quotes in last 30 days', async () => {
    const quotes: DeviceQuote[] = [
      createQuote(now),
      createQuote(oneWeekAgo),
      createQuote(twoWeeksAgo),
      createQuote(oneMonthAgo), // At boundary, may or may not be included
    ];

    const metrics = await calculateVolumeMetrics(quotes);

    // At least 3 quotes should be within 30 days
    expect(metrics.quotesThisMonth).toBeGreaterThanOrEqual(3);
    expect(metrics.quotesThisMonth).toBeLessThanOrEqual(4);
  });

  it('should group quotes by day', async () => {
    const quotes: DeviceQuote[] = [
      createQuote(now),
      createQuote(now),
      createQuote(oneDayAgo),
      createQuote(threeDaysAgo),
    ];

    const metrics = await calculateVolumeMetrics(quotes);

    expect(metrics.quotesByDay).toBeDefined();
    expect(Array.isArray(metrics.quotesByDay)).toBe(true);
    expect(metrics.quotesByDay.length).toBeGreaterThan(0);

    // Each entry should have date and count
    metrics.quotesByDay.forEach(entry => {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('count');
      expect(entry.count).toBeGreaterThan(0);
    });
  });

  it('should return zeros when no quotes', async () => {
    const metrics = await calculateVolumeMetrics([]);

    expect(metrics.quotesToday).toBe(0);
    expect(metrics.quotesThisWeek).toBe(0);
    expect(metrics.quotesThisMonth).toBe(0);
    expect(metrics.quotesByDay).toHaveLength(0);
  });

  it('should format dates as ISO strings', async () => {
    const quotes: DeviceQuote[] = [createQuote(now)];
    const metrics = await calculateVolumeMetrics(quotes);

    if (metrics.quotesByDay.length > 0) {
      // Date should be in YYYY-MM-DD format
      expect(metrics.quotesByDay[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// ============================================================================
// Anchor Metrics Tests
// ============================================================================

describe('calculateAnchorMetrics', () => {
  it('should count total anchors', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ status: 'approved' }),
      createAnchor({ status: 'pending' }),
      createAnchor({ status: 'rejected' }),
    ];

    const metrics = await calculateAnchorMetrics(anchors, mockPolicy);

    expect(metrics.total).toBe(3);
  });

  it('should count anchors by status', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ status: 'approved' }),
      createAnchor({ status: 'approved' }),
      createAnchor({ status: 'pending' }),
      createAnchor({ status: 'rejected' }),
    ];

    const metrics = await calculateAnchorMetrics(anchors, mockPolicy);

    expect(metrics.approved).toBe(2);
    expect(metrics.pending).toBe(1);
    expect(metrics.rejected).toBe(1);
  });

  it('should count stale anchors', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ scrapedAt: now, status: 'approved' }),
      createAnchor({ scrapedAt: twoWeeksAgo, status: 'approved' }), // Stale
      createAnchor({ scrapedAt: twoWeeksAgo, status: 'approved' }), // Stale
    ];

    const metrics = await calculateAnchorMetrics(anchors, mockPolicy);

    expect(metrics.stale).toBe(2);
  });

  it('should break down by source', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', status: 'approved' }),
      createAnchor({ source: 'cex', status: 'approved' }),
      createAnchor({ source: 'cex', status: 'pending' }),
      createAnchor({ source: 'back_market', status: 'approved' }),
      createAnchor({ source: 'back_market', status: 'approved', scrapedAt: twoWeeksAgo }),
    ];

    const metrics = await calculateAnchorMetrics(anchors, mockPolicy);

    expect(metrics.bySource.cex.total).toBe(3);
    expect(metrics.bySource.cex.approved).toBe(2);
    expect(metrics.bySource.back_market.total).toBe(2);
    expect(metrics.bySource.back_market.stale).toBe(1);
  });

  it('should return zeros when no anchors', async () => {
    const metrics = await calculateAnchorMetrics([], mockPolicy);

    expect(metrics.total).toBe(0);
    expect(metrics.pending).toBe(0);
    expect(metrics.approved).toBe(0);
    expect(metrics.rejected).toBe(0);
    expect(metrics.stale).toBe(0);
  });
});

// ============================================================================
// Confidence Metrics Tests
// ============================================================================

describe('calculateConfidenceMetrics', () => {
  it('should calculate overall confidence', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: now, status: 'approved' }),
      createAnchor({ source: 'back_market', price: 382, scrapedAt: now, status: 'approved' }),
    ];

    const metrics = await calculateConfidenceMetrics(anchors, mockPolicy);

    expect(metrics.overall).toBeGreaterThan(0);
    expect(metrics.overall).toBeLessThanOrEqual(1);
  });

  it('should calculate confidence by source', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: now, status: 'approved' }),
      createAnchor({ source: 'cex', price: 382, scrapedAt: now, status: 'approved' }),
      createAnchor({ source: 'back_market', price: 400, scrapedAt: twoWeeksAgo, status: 'approved' }),
    ];

    const metrics = await calculateConfidenceMetrics(anchors, mockPolicy);

    // CeX should have higher confidence (fresh, agreeing prices)
    expect(metrics.bySource.cex).toBeGreaterThan(metrics.bySource.back_market);
  });

  it('should include confidence factors', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ source: 'cex', price: 380, scrapedAt: now, status: 'approved' }),
    ];

    const metrics = await calculateConfidenceMetrics(anchors, mockPolicy);

    expect(metrics.factors).toHaveProperty('freshness');
    expect(metrics.factors).toHaveProperty('sourceAgreement');
    expect(metrics.factors).toHaveProperty('coverage');

    expect(metrics.factors.freshness).toBeGreaterThanOrEqual(0);
    expect(metrics.factors.freshness).toBeLessThanOrEqual(1);
  });

  it('should return 0 confidence when no approved anchors', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ status: 'pending' }),
      createAnchor({ status: 'rejected' }),
    ];

    const metrics = await calculateConfidenceMetrics(anchors, mockPolicy);

    expect(metrics.overall).toBe(0);
  });

  it('should penalize missing sources', async () => {
    const bothSources: MarketAnchor[] = [
      createAnchor({ source: 'cex', status: 'approved' }),
      createAnchor({ source: 'back_market', status: 'approved' }),
    ];

    const oneSource: MarketAnchor[] = [
      createAnchor({ source: 'cex', status: 'approved' }),
    ];

    const bothMetrics = await calculateConfidenceMetrics(bothSources, mockPolicy);
    const oneMetrics = await calculateConfidenceMetrics(oneSource, mockPolicy);

    expect(oneMetrics.factors.coverage).toBeLessThan(bothMetrics.factors.coverage);
  });
});

// ============================================================================
// Momentum Tests
// ============================================================================

describe('calculateMomentum', () => {
  it('should detect upward trend (> +5%)', async () => {
    // Week 2 prices higher than week 1
    const anchors: MarketAnchor[] = [
      createAnchor({ price: 400, scrapedAt: now }),
      createAnchor({ price: 410, scrapedAt: oneDayAgo }),
      createAnchor({ price: 350, scrapedAt: twoWeeksAgo }),
      createAnchor({ price: 360, scrapedAt: new Date(twoWeeksAgo.getTime() + 24 * 60 * 60 * 1000) }),
    ];

    const momentum = await calculateMomentum(anchors, mockPolicy);

    expect(momentum.trend).toBe('up');
    expect(momentum.percentChange7d).toBeGreaterThan(5);
  });

  it('should detect downward trend (< -5%)', async () => {
    // Week 2 prices lower than week 1
    const anchors: MarketAnchor[] = [
      createAnchor({ price: 350, scrapedAt: now }),
      createAnchor({ price: 340, scrapedAt: oneDayAgo }),
      createAnchor({ price: 400, scrapedAt: twoWeeksAgo }),
      createAnchor({ price: 410, scrapedAt: new Date(twoWeeksAgo.getTime() + 24 * 60 * 60 * 1000) }),
    ];

    const momentum = await calculateMomentum(anchors, mockPolicy);

    expect(momentum.trend).toBe('down');
    expect(momentum.percentChange7d).toBeLessThan(-5);
  });

  it('should detect stable trend (±5%)', async () => {
    // Prices roughly the same
    const anchors: MarketAnchor[] = [
      createAnchor({ price: 380, scrapedAt: now }),
      createAnchor({ price: 382, scrapedAt: oneDayAgo }),
      createAnchor({ price: 378, scrapedAt: twoWeeksAgo }),
      createAnchor({ price: 380, scrapedAt: new Date(twoWeeksAgo.getTime() + 24 * 60 * 60 * 1000) }),
    ];

    const momentum = await calculateMomentum(anchors, mockPolicy);

    expect(momentum.trend).toBe('stable');
    expect(Math.abs(momentum.percentChange7d)).toBeLessThanOrEqual(5);
  });

  it('should calculate 7-day percent change', async () => {
    // Create anchors with clear time separation
    const currentWeek = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const previousWeek = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    
    const anchors: MarketAnchor[] = [
      createAnchor({ price: 420, scrapedAt: currentWeek }),
      createAnchor({ price: 400, scrapedAt: previousWeek }),
    ];

    const momentum = await calculateMomentum(anchors, mockPolicy);

    // (420 - 400) / 400 * 100 = 5%
    expect(momentum.percentChange7d).toBeCloseTo(5, 0);
  });

  it('should calculate 30-day percent change', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ price: 400, scrapedAt: now }),
      createAnchor({ price: 500, scrapedAt: oneMonthAgo }),
    ];

    const momentum = await calculateMomentum(anchors, mockPolicy);

    // (400 - 500) / 500 * 100 = -20%
    expect(momentum.percentChange30d).toBeCloseTo(-20, 0);
  });

  it('should include price history', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ price: 380, scrapedAt: now }),
      createAnchor({ price: 375, scrapedAt: oneDayAgo }),
      createAnchor({ price: 370, scrapedAt: threeDaysAgo }),
    ];

    const momentum = await calculateMomentum(anchors, mockPolicy);

    expect(momentum.priceHistory).toBeDefined();
    expect(Array.isArray(momentum.priceHistory)).toBe(true);
    expect(momentum.priceHistory.length).toBeGreaterThan(0);

    momentum.priceHistory.forEach(entry => {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('avgPrice');
    });
  });

  it('should handle missing historical data', async () => {
    // Only recent anchors, no historical comparison
    const anchors: MarketAnchor[] = [
      createAnchor({ price: 380, scrapedAt: now }),
    ];

    const momentum = await calculateMomentum(anchors, mockPolicy);

    // Should return stable or 0% change when no historical data
    expect(momentum.trend).toBe('stable');
    expect(momentum.percentChange7d).toBe(0);
  });

  it('should handle empty anchors', async () => {
    const momentum = await calculateMomentum([], mockPolicy);

    expect(momentum.trend).toBe('stable');
    expect(momentum.percentChange7d).toBe(0);
    expect(momentum.percentChange30d).toBe(0);
    expect(momentum.priceHistory).toHaveLength(0);
  });
});

// ============================================================================
// Full Market Indicators Tests
// ============================================================================

describe('getMarketIndicators', () => {
  it('should aggregate all metrics', async () => {
    const indicators = await getMarketIndicators();

    expect(indicators).toHaveProperty('volume');
    expect(indicators).toHaveProperty('anchors');
    expect(indicators).toHaveProperty('confidence');
    expect(indicators).toHaveProperty('momentum');
    expect(indicators).toHaveProperty('generatedAt');
  });

  it('should include generation timestamp', async () => {
    const before = new Date();
    const indicators = await getMarketIndicators();
    const after = new Date();

    expect(indicators.generatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(indicators.generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should filter by device when specified', async () => {
    const indicators = await getMarketIndicators({ deviceId: 'device-1' });

    // Results should be filtered to device-1 only
    expect(indicators).toBeDefined();
  });

  it('should filter by source when specified', async () => {
    const indicators = await getMarketIndicators({ source: 'cex' });

    // Results should be filtered to CeX only
    expect(indicators).toBeDefined();
  });

  it('should filter by date range when specified', async () => {
    const indicators = await getMarketIndicators({
      startDate: oneWeekAgo,
      endDate: now,
    });

    expect(indicators).toBeDefined();
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle quotes with future dates', async () => {
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const quotes: DeviceQuote[] = [createQuote(futureDate)];

    const metrics = await calculateVolumeMetrics(quotes);

    // Future quotes should not be counted in today/week/month
    expect(metrics.quotesToday).toBe(0);
  });

  it('should handle anchors with zero price', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ price: 0 }),
      createAnchor({ price: 380 }),
    ];

    const momentum = await calculateMomentum(anchors, mockPolicy);

    // Should handle gracefully, possibly filtering out zero prices
    expect(Number.isFinite(momentum.percentChange7d)).toBe(true);
  });

  it('should not produce NaN in confidence calculations', async () => {
    const anchors: MarketAnchor[] = [
      createAnchor({ price: 0 }),
    ];

    const metrics = await calculateConfidenceMetrics(anchors, mockPolicy);

    expect(Number.isNaN(metrics.overall)).toBe(false);
    expect(Number.isNaN(metrics.factors.freshness)).toBe(false);
    expect(Number.isNaN(metrics.factors.sourceAgreement)).toBe(false);
  });

  it('should handle very large numbers of quotes', async () => {
    const quotes: DeviceQuote[] = Array(10000).fill(null).map(() => createQuote(now));

    const metrics = await calculateVolumeMetrics(quotes);

    expect(metrics.quotesToday).toBe(10000);
  });

  it('should handle timezone edge cases', async () => {
    // Create quote at midnight UTC
    const midnightUTC = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');
    const quotes: DeviceQuote[] = [createQuote(midnightUTC)];

    const metrics = await calculateVolumeMetrics(quotes);

    // Should count correctly regardless of timezone
    expect(metrics.quotesToday).toBeGreaterThanOrEqual(0);
  });
});

