import type { EnrichedListing } from "../types/Listing.js";
import type { BaselineScore } from "../types/DealScore.js";

/**
 * Statistical Baseline Score Calculator
 * Pure mathematical evaluation without AI
 */

/**
 * Condition quality multipliers
 */
const CONDITION_MULTIPLIERS = {
  new: 1.0,
  "like-new": 0.95,
  excellent: 0.85,
  good: 0.7,
  fair: 0.5,
  poor: 0.3,
  unknown: 0.6,
};

/**
 * Calculate price vs market comparison
 * Returns score from -100 (way overpriced) to 100 (steal deal)
 */
function calculatePriceVsMarket(listing: EnrichedListing): number {
  if (!listing.comparableSales || listing.comparableSales.length === 0) {
    return 0; // neutral if no comp data
  }

  // Calculate median comparable price
  const prices = listing.comparableSales.map((sale) => sale.price).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];

  if (median === 0) return 0;

  // Percentage difference (negative = below market = good deal)
  const percentDiff = ((listing.price - median) / median) * 100;

  // Convert to score: -50% difference = 100 score, +50% difference = -100 score
  const score = Math.max(-100, Math.min(100, -percentDiff * 2));

  return score;
}

/**
 * Calculate price vs MSRP if available
 * Returns percentage below/above MSRP
 */
function calculatePriceVsMSRP(listing: EnrichedListing): number {
  if (!listing.msrp || listing.msrp === 0) {
    return 0; // no MSRP data
  }

  const percentOfMSRP = (listing.price / listing.msrp) * 100;
  return 100 - percentOfMSRP; // positive = below MSRP
}

/**
 * Calculate category demand score
 */
function calculateCategoryDemand(listing: EnrichedListing): number {
  if (!listing.categoryTrends) {
    return 50; // neutral default
  }

  const { demandScore, salesVolume, priceChange30d } = listing.categoryTrends;

  // Weighted combination
  let score = demandScore * 0.6; // base demand

  // Sales volume boost (assuming high volume = high demand)
  if (salesVolume > 100) {
    score += 10;
  } else if (salesVolume > 50) {
    score += 5;
  }

  // Price trend adjustment
  if (priceChange30d > 5) {
    score += 10; // prices rising = hot category
  } else if (priceChange30d < -5) {
    score -= 10; // prices falling = cooling category
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate condition premium/penalty
 */
function calculateConditionPremium(listing: EnrichedListing): number {
  const multiplier = CONDITION_MULTIPLIERS[listing.condition] || 0.6;

  // Convert multiplier to adjustment score
  // 1.0 = 0 adjustment, 0.5 = -50 adjustment
  const adjustment = (multiplier - 0.6) * 100;

  return adjustment;
}

/**
 * Calculate overall baseline score
 * Combines all statistical factors into 0-100 score
 */
function calculateOverallBaseline(components: {
  priceVsMarket: number;
  priceVsMSRP: number;
  categoryDemand: number;
  conditionPremium: number;
}): number {
  // Start with neutral 50
  let score = 50;

  // Price vs market (most important)
  score += components.priceVsMarket * 0.4;

  // Price vs MSRP
  if (components.priceVsMSRP !== 0) {
    score += (components.priceVsMSRP / 100) * 20;
  }

  // Category demand
  score += ((components.categoryDemand - 50) / 50) * 15;

  // Condition adjustment
  score += components.conditionPremium * 0.25;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Main baseline score calculator
 */
export function calculateBaselineScore(listing: EnrichedListing): BaselineScore {
  const priceVsMarket = calculatePriceVsMarket(listing);
  const priceVsMSRP = calculatePriceVsMSRP(listing);
  const categoryDemand = calculateCategoryDemand(listing);
  const conditionPremium = calculateConditionPremium(listing);

  const overallBaseline = calculateOverallBaseline({
    priceVsMarket,
    priceVsMSRP,
    categoryDemand,
    conditionPremium,
  });

  return {
    priceVsMarket,
    priceVsMSRP,
    categoryDemand,
    conditionPremium,
    overallBaseline,
  };
}

/**
 * Quick baseline evaluation (when no enrichment data available)
 */
export function quickBaselineScore(price: number, msrp?: number): number {
  if (!msrp || msrp === 0) {
    return 50; // neutral
  }

  const percentOfMSRP = (price / msrp) * 100;

  // Simple scoring based on discount
  if (percentOfMSRP <= 50) return 90; // 50%+ off = excellent
  if (percentOfMSRP <= 60) return 80; // 40% off = very good
  if (percentOfMSRP <= 70) return 70; // 30% off = good
  if (percentOfMSRP <= 80) return 60; // 20% off = decent
  if (percentOfMSRP <= 90) return 50; // 10% off = okay
  if (percentOfMSRP <= 100) return 40; // at MSRP = below average
  return 30; // above MSRP = bad deal
}
