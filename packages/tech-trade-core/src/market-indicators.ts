/**
 * Market Indicators Module
 * 
 * Calculates market health metrics including quote volume, anchor freshness,
 * confidence scoring, and price momentum for operational monitoring.
 */

import type {
  DeviceQuote,
  MarketAnchor,
  PricingPolicy,
  VolumeMetrics,
  AnchorMetrics,
  ConfidenceMetrics,
  MomentumMetrics,
  MarketIndicators,
  IndicatorFilters,
  AnchorSource,
} from './types';
import { isAnchorStale, calculateAnchorConfidence } from './anchor-blending';
import { getRiskControlConfig } from './policy-enforcement';

/**
 * Round a number to 2 decimal places
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format date as YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get date N days ago from now
 */
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Check if a date is within a range
 */
function isWithinRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

// ============================================================================
// Volume Metrics
// ============================================================================

/**
 * Calculate quote volume metrics
 * 
 * @param quotes - List of device quotes
 * @returns Volume metrics with daily/weekly/monthly counts
 */
export async function calculateVolumeMetrics(
  quotes: DeviceQuote[]
): Promise<VolumeMetrics> {
  const now = new Date();
  const todayStart = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  // Filter out future quotes
  const validQuotes = quotes.filter(q => q.createdAt <= now);

  // Count by time period
  const quotesToday = validQuotes.filter(q => q.createdAt >= todayStart).length;
  const quotesThisWeek = validQuotes.filter(q => q.createdAt >= weekAgo).length;
  const quotesThisMonth = validQuotes.filter(q => q.createdAt >= monthAgo).length;

  // Group by day
  const quotesByDayMap = new Map<string, number>();
  for (const quote of validQuotes.filter(q => q.createdAt >= monthAgo)) {
    const dateKey = formatDate(quote.createdAt);
    quotesByDayMap.set(dateKey, (quotesByDayMap.get(dateKey) || 0) + 1);
  }

  const quotesByDay = Array.from(quotesByDayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    quotesToday,
    quotesThisWeek,
    quotesThisMonth,
    quotesByDay,
  };
}

// ============================================================================
// Anchor Metrics
// ============================================================================

/**
 * Calculate anchor metrics
 * 
 * @param anchors - List of market anchors
 * @param policy - Pricing policy for staleness check
 * @returns Anchor metrics with status breakdown
 */
export async function calculateAnchorMetrics(
  anchors: MarketAnchor[],
  policy: PricingPolicy
): Promise<AnchorMetrics> {
  const total = anchors.length;
  const pending = anchors.filter(a => a.status === 'pending').length;
  const approved = anchors.filter(a => a.status === 'approved').length;
  const rejected = anchors.filter(a => a.status === 'rejected').length;
  const stale = anchors.filter(a => isAnchorStale(a, policy)).length;

  // Break down by source
  const bySource: Record<AnchorSource, { total: number; approved: number; stale: number }> = {
    cex: { total: 0, approved: 0, stale: 0 },
    back_market: { total: 0, approved: 0, stale: 0 },
  };

  for (const anchor of anchors) {
    const source = anchor.source as AnchorSource;
    if (bySource[source]) {
      bySource[source].total++;
      if (anchor.status === 'approved') {
        bySource[source].approved++;
      }
      if (isAnchorStale(anchor, policy)) {
        bySource[source].stale++;
      }
    }
  }

  return {
    total,
    pending,
    approved,
    rejected,
    stale,
    bySource,
  };
}

// ============================================================================
// Confidence Metrics
// ============================================================================

/**
 * Calculate confidence metrics
 * 
 * @param anchors - List of market anchors
 * @param policy - Pricing policy
 * @returns Confidence metrics with breakdown
 */
export async function calculateConfidenceMetrics(
  anchors: MarketAnchor[],
  policy: PricingPolicy
): Promise<ConfidenceMetrics> {
  // Filter to approved anchors only
  const approvedAnchors = anchors.filter(a => a.status === 'approved' && a.price > 0);

  if (approvedAnchors.length === 0) {
    return {
      overall: 0,
      bySource: { cex: 0, back_market: 0 },
      factors: {
        freshness: 0,
        sourceAgreement: 0,
        coverage: 0,
      },
    };
  }

  // Calculate overall confidence
  const overall = calculateAnchorConfidence(approvedAnchors, policy);

  // Calculate confidence by source
  const cexAnchors = approvedAnchors.filter(a => a.source === 'cex');
  const backMarketAnchors = approvedAnchors.filter(a => a.source === 'back_market');

  const bySource: Record<AnchorSource, number> = {
    cex: cexAnchors.length > 0 ? calculateAnchorConfidence(cexAnchors, policy) : 0,
    back_market: backMarketAnchors.length > 0 ? calculateAnchorConfidence(backMarketAnchors, policy) : 0,
  };

  // Calculate individual factors
  const freshAnchors = approvedAnchors.filter(a => !isAnchorStale(a, policy));
  const freshness = freshAnchors.length / approvedAnchors.length;

  // Source agreement (inverse of coefficient of variation)
  const prices = approvedAnchors.map(a => a.price);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  let sourceAgreement = 1;
  if (prices.length > 1 && mean > 0) {
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    sourceAgreement = Math.max(0, 1 - Math.min(cv, 1));
  }

  // Coverage
  const sources = new Set(approvedAnchors.map(a => a.source));
  const coverage = sources.size / 2; // 2 expected sources

  return {
    overall,
    bySource,
    factors: {
      freshness: round2(freshness),
      sourceAgreement: round2(sourceAgreement),
      coverage: round2(coverage),
    },
  };
}

// ============================================================================
// Momentum Metrics
// ============================================================================

/**
 * Calculate price momentum metrics
 * 
 * @param anchors - List of market anchors
 * @param policy - Pricing policy
 * @returns Momentum metrics with trend direction
 */
export async function calculateMomentum(
  anchors: MarketAnchor[],
  policy: PricingPolicy
): Promise<MomentumMetrics> {
  // Filter to approved anchors with valid prices
  const validAnchors = anchors.filter(a => a.status === 'approved' && a.price > 0);

  if (validAnchors.length === 0) {
    return {
      trend: 'stable',
      percentChange7d: 0,
      percentChange30d: 0,
      priceHistory: [],
    };
  }

  const now = new Date();
  const weekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);
  const monthAgo = daysAgo(30);
  const twoMonthsAgo = daysAgo(60);

  // Get current week and previous week averages
  const currentWeekAnchors = validAnchors.filter(a => a.scrapedAt >= weekAgo);
  const previousWeekAnchors = validAnchors.filter(
    a => a.scrapedAt >= twoWeeksAgo && a.scrapedAt < weekAgo
  );

  // Get current month and previous month averages
  const currentMonthAnchors = validAnchors.filter(a => a.scrapedAt >= monthAgo);
  const previousMonthAnchors = validAnchors.filter(
    a => a.scrapedAt >= twoMonthsAgo && a.scrapedAt < monthAgo
  );

  // Calculate averages
  const avgPrice = (anchors: MarketAnchor[]): number => {
    if (anchors.length === 0) return 0;
    return anchors.reduce((sum, a) => sum + a.price, 0) / anchors.length;
  };

  const currentWeekAvg = avgPrice(currentWeekAnchors);
  const previousWeekAvg = avgPrice(previousWeekAnchors);
  const currentMonthAvg = avgPrice(currentMonthAnchors);
  const previousMonthAvg = avgPrice(previousMonthAnchors);

  // Calculate percent changes
  let percentChange7d = 0;
  if (previousWeekAvg > 0 && currentWeekAvg > 0) {
    percentChange7d = round2(((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100);
  }

  let percentChange30d = 0;
  if (previousMonthAvg > 0 && currentMonthAvg > 0) {
    percentChange30d = round2(((currentMonthAvg - previousMonthAvg) / previousMonthAvg) * 100);
  }

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (percentChange7d > 5) {
    trend = 'up';
  } else if (percentChange7d < -5) {
    trend = 'down';
  }

  // Build price history (daily averages for last 30 days)
  const priceHistoryMap = new Map<string, number[]>();
  for (const anchor of validAnchors.filter(a => a.scrapedAt >= monthAgo)) {
    const dateKey = formatDate(anchor.scrapedAt);
    if (!priceHistoryMap.has(dateKey)) {
      priceHistoryMap.set(dateKey, []);
    }
    priceHistoryMap.get(dateKey)!.push(anchor.price);
  }

  const priceHistory = Array.from(priceHistoryMap.entries())
    .map(([date, prices]) => ({
      date,
      avgPrice: round2(prices.reduce((a, b) => a + b, 0) / prices.length),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    trend,
    percentChange7d,
    percentChange30d,
    priceHistory,
  };
}

// ============================================================================
// Full Market Indicators
// ============================================================================

// Repository interfaces for data access
interface QuoteRepository {
  findMany(params?: { where?: object }): Promise<DeviceQuote[]>;
}

interface AnchorRepository {
  findMany(params?: { where?: object }): Promise<MarketAnchor[]>;
}

interface PolicyRepository {
  findFirst(params: { where: { isActive: boolean } }): Promise<PricingPolicy | null>;
}

let quoteRepository: QuoteRepository | null = null;
let anchorRepository: AnchorRepository | null = null;
let policyRepository: PolicyRepository | null = null;

/**
 * Set repositories for data access (dependency injection)
 */
export function setIndicatorRepositories(
  quotes: QuoteRepository,
  anchors: AnchorRepository,
  policy: PolicyRepository
): void {
  quoteRepository = quotes;
  anchorRepository = anchors;
  policyRepository = policy;
}

/**
 * Get comprehensive market indicators
 * 
 * @param filters - Optional filters for device, source, date range
 * @returns Full market indicators
 */
export async function getMarketIndicators(
  filters?: IndicatorFilters
): Promise<MarketIndicators> {
  // Build query filters
  const quoteWhere: Record<string, unknown> = {};
  const anchorWhere: Record<string, unknown> = {};

  if (filters?.deviceId) {
    quoteWhere.deviceId = filters.deviceId;
    anchorWhere.deviceId = filters.deviceId;
  }

  if (filters?.source) {
    anchorWhere.source = filters.source;
  }

  // Fetch data
  const quotes = quoteRepository
    ? await quoteRepository.findMany({ where: quoteWhere })
    : [];

  const anchors = anchorRepository
    ? await anchorRepository.findMany({ where: anchorWhere })
    : [];

  const policy = policyRepository
    ? await policyRepository.findFirst({ where: { isActive: true } })
    : null;

  // Use default policy if none found
  const effectivePolicy: PricingPolicy = policy || {
    id: 'default',
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

  // Apply date filters if specified
  let filteredQuotes = quotes;
  let filteredAnchors = anchors;

  if (filters?.startDate || filters?.endDate) {
    const start = filters.startDate || new Date(0);
    const end = filters.endDate || new Date();

    filteredQuotes = quotes.filter(q => isWithinRange(q.createdAt, start, end));
    filteredAnchors = anchors.filter(a => isWithinRange(a.scrapedAt, start, end));
  }

  // Calculate all metrics
  const [volume, anchorMetrics, confidence, momentum] = await Promise.all([
    calculateVolumeMetrics(filteredQuotes),
    calculateAnchorMetrics(filteredAnchors, effectivePolicy),
    calculateConfidenceMetrics(filteredAnchors, effectivePolicy),
    calculateMomentum(filteredAnchors, effectivePolicy),
  ]);

  // Get current risk control state for system status
  const riskControl = getRiskControlConfig();

  return {
    volume,
    anchors: anchorMetrics,
    confidence,
    momentum,
    generatedAt: new Date(),
    systemStatus: {
      pricingHalted: riskControl.pricingHalted,
      haltReason: riskControl.haltReason,
    },
  };
}

