/**
 * Anchor Blending Module
 * 
 * Combines market signals from multiple sources (CeX, Back Market) with
 * policy-based pricing using configurable weights. Includes confidence
 * scoring and staleness detection.
 */

import type {
  MarketAnchor,
  PricingPolicy,
  Condition,
  AnchorBlendResult,
  AnchorSource,
} from './types';

/**
 * Round a number to 2 decimal places
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate days since a date
 */
function daysSince(date: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Check if an anchor is stale based on policy
 * 
 * @param anchor - The market anchor
 * @param policy - The pricing policy with max age setting
 * @returns True if anchor is older than max age
 */
export function isAnchorStale(anchor: MarketAnchor, policy: PricingPolicy): boolean {
  const age = daysSince(anchor.scrapedAt);
  return age > policy.anchorMaxAgeDays;
}

/**
 * Filter anchors by condition
 * 
 * @param anchors - List of market anchors
 * @param condition - Condition to filter by
 * @returns Anchors matching the condition
 */
export function getAnchorsByCondition(
  anchors: MarketAnchor[],
  condition: Condition
): MarketAnchor[] {
  return anchors.filter(a => a.condition === condition);
}

/**
 * Redistribute weights when some sources are missing
 * 
 * When a source is unavailable, its weight is redistributed proportionally
 * to the remaining sources.
 * 
 * @param availableSources - List of available source names
 * @param policy - The pricing policy with default weights
 * @returns Redistributed weights for each source
 */
export function redistributeWeights(
  availableSources: string[],
  policy: PricingPolicy
): { cex: number; back_market: number; policy: number } {
  const hasCex = availableSources.includes('cex');
  const hasBackMarket = availableSources.includes('back_market');

  // If no sources available, use 100% policy
  if (!hasCex && !hasBackMarket) {
    return { cex: 0, back_market: 0, policy: 1.0 };
  }

  // Calculate total available weight (excluding missing sources)
  let totalWeight = policy.weightPolicy;
  if (hasCex) totalWeight += policy.weightCex;
  if (hasBackMarket) totalWeight += policy.weightBackMarket;

  // Redistribute proportionally
  return {
    cex: hasCex ? round2(policy.weightCex / totalWeight) : 0,
    back_market: hasBackMarket ? round2(policy.weightBackMarket / totalWeight) : 0,
    policy: round2(policy.weightPolicy / totalWeight),
  };
}

/**
 * Blend market anchors with policy price
 * 
 * Uses weighted average of anchor prices and policy price based on
 * configured weights. Handles missing sources by redistributing weights.
 * 
 * @param anchors - List of approved market anchors
 * @param policyPrice - The policy-calculated price (base + condition + attributes)
 * @param policy - The pricing policy with weights
 * @param condition - Optional condition to filter anchors
 * @returns Blended price result with confidence and warnings
 */
export function blendAnchors(
  anchors: MarketAnchor[],
  policyPrice: number,
  policy: PricingPolicy,
  condition?: Condition
): AnchorBlendResult {
  const warnings: string[] = [];

  // Filter to approved anchors only
  let validAnchors = anchors.filter(a => a.status === 'approved');

  // Filter by condition if specified
  if (condition) {
    validAnchors = getAnchorsByCondition(validAnchors, condition);
  }

  // Filter out stale anchors
  const freshAnchors = validAnchors.filter(a => !isAnchorStale(a, policy));
  const staleCount = validAnchors.length - freshAnchors.length;

  if (staleCount > 0 && freshAnchors.length > 0) {
    warnings.push('Some anchors were filtered due to staleness');
  }

  // Filter out invalid prices (zero or negative)
  const validPriceAnchors = freshAnchors.filter(a => a.price > 0);
  if (validPriceAnchors.length < freshAnchors.length) {
    warnings.push('Invalid anchor price detected');
  }

  // If no valid anchors, return null blended price
  if (validPriceAnchors.length === 0) {
    if (validAnchors.length > 0 && freshAnchors.length === 0) {
      warnings.push('All anchors are stale');
    } else {
      warnings.push('No approved anchors available');
    }
    return {
      blendedPrice: null,
      confidence: 0,
      warnings,
      anchorsUsed: [],
    };
  }

  // Group anchors by source and calculate averages
  const anchorsBySource: Record<AnchorSource, MarketAnchor[]> = {
    cex: validPriceAnchors.filter(a => a.source === 'cex'),
    back_market: validPriceAnchors.filter(a => a.source === 'back_market'),
  };

  const avgBySource: Record<string, number> = {};
  const availableSources: string[] = [];

  for (const [source, sourceAnchors] of Object.entries(anchorsBySource)) {
    if (sourceAnchors.length > 0) {
      const sum = sourceAnchors.reduce((acc, a) => acc + a.price, 0);
      avgBySource[source] = sum / sourceAnchors.length;
      availableSources.push(source);
    }
  }

  // Check for missing sources
  if (!availableSources.includes('cex')) {
    warnings.push('Missing anchor source: cex');
  }
  if (!availableSources.includes('back_market')) {
    warnings.push('Missing anchor source: back_market');
  }

  // Redistribute weights based on available sources
  const weights = redistributeWeights(availableSources, policy);

  // Calculate blended price
  let blendedPrice = 0;
  if (avgBySource['cex']) {
    blendedPrice += avgBySource['cex'] * weights.cex;
  }
  if (avgBySource['back_market']) {
    blendedPrice += avgBySource['back_market'] * weights.back_market;
  }
  blendedPrice += policyPrice * weights.policy;

  // Calculate confidence
  const confidence = calculateAnchorConfidence(validPriceAnchors, policy);

  return {
    blendedPrice: round2(blendedPrice),
    confidence,
    warnings,
    anchorsUsed: validPriceAnchors,
  };
}

/**
 * Calculate confidence score for a set of anchors
 * 
 * Confidence is based on:
 * - Freshness: % of anchors within max age (40% weight)
 * - Source agreement: inverse of price coefficient of variation (40% weight)
 * - Coverage: % of expected sources present (20% weight)
 * 
 * @param anchors - List of market anchors
 * @param policy - The pricing policy
 * @returns Confidence score between 0 and 1
 */
export function calculateAnchorConfidence(
  anchors: MarketAnchor[],
  policy: PricingPolicy
): number {
  if (anchors.length === 0) {
    return 0;
  }

  // Filter to approved anchors with valid prices
  const validAnchors = anchors.filter(
    a => a.status === 'approved' && a.price > 0
  );

  if (validAnchors.length === 0) {
    return 0;
  }

  // 1. Freshness score (40% weight)
  const freshAnchors = validAnchors.filter(a => !isAnchorStale(a, policy));
  const freshness = freshAnchors.length / validAnchors.length;

  // 2. Source agreement score (40% weight)
  // Use coefficient of variation (stdDev / mean)
  const prices = validAnchors.map(a => a.price);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  let sourceAgreement = 1;
  if (prices.length > 1 && mean > 0) {
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    // Invert CV so higher agreement = higher score
    // Cap CV at 1 to prevent negative scores
    sourceAgreement = Math.max(0, 1 - Math.min(cv, 1));
  }

  // 3. Coverage score (20% weight)
  const sources = new Set(validAnchors.map(a => a.source));
  const expectedSources = ['cex', 'back_market'];
  const coverage = sources.size / expectedSources.length;

  // Weighted average
  const confidence = (freshness * 0.4) + (sourceAgreement * 0.4) + (coverage * 0.2);

  return round2(Math.min(1, Math.max(0, confidence)));
}

