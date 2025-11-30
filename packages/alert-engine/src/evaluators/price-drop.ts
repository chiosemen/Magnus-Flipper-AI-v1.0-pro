/**
 * Price Drop Alert Evaluator
 * Evaluates if a listing price meets the alert threshold
 */

import type {
  PriceDropConditions,
  ListingToEvaluate,
  EvaluationResult,
} from "../types";

/**
 * Evaluate price drop condition
 */
export function evaluatePriceDrop(
  conditions: PriceDropConditions,
  listing: ListingToEvaluate
): EvaluationResult {
  // Listing must have a price
  if (listing.price === null || listing.price === undefined) {
    return {
      triggered: false,
      trigger_reason: "Listing has no price",
    };
  }

  const { price_threshold, comparison, location, radius_km } = conditions;

  // Evaluate price comparison
  let priceMatches = false;
  let comparisonText = "";

  switch (comparison) {
    case "less_than":
      priceMatches = listing.price < price_threshold;
      comparisonText = `< ${price_threshold}`;
      break;
    case "less_than_or_equal":
      priceMatches = listing.price <= price_threshold;
      comparisonText = `<= ${price_threshold}`;
      break;
    case "greater_than":
      priceMatches = listing.price > price_threshold;
      comparisonText = `> ${price_threshold}`;
      break;
    case "greater_than_or_equal":
      priceMatches = listing.price >= price_threshold;
      comparisonText = `>= ${price_threshold}`;
      break;
    default:
      return {
        triggered: false,
        trigger_reason: `Unknown comparison type: ${comparison}`,
      };
  }

  if (!priceMatches) {
    return {
      triggered: false,
      trigger_reason: `Price ${listing.price} does not match ${comparisonText}`,
    };
  }

  // Evaluate location (optional)
  if (location && listing.location) {
    const locationMatches = checkLocationMatch(
      listing.location,
      location,
      radius_km
    );

    if (!locationMatches) {
      return {
        triggered: false,
        trigger_reason: `Location "${listing.location}" does not match "${location}"`,
      };
    }
  }

  // Alert triggered!
  return {
    triggered: true,
    trigger_reason: `Price ${listing.price} matches condition ${comparisonText}${
      location ? ` in ${location}` : ""
    }`,
    matched_listing: listing,
    metadata: {
      price: listing.price,
      threshold: price_threshold,
      comparison,
      location: listing.location,
    },
  };
}

/**
 * Check if location matches (simple string matching for now)
 * In production, this would use geocoding and distance calculation
 */
function checkLocationMatch(
  listingLocation: string,
  targetLocation: string,
  radiusKm?: number
): boolean {
  const normalizedListingLocation = listingLocation.toLowerCase().trim();
  const normalizedTargetLocation = targetLocation.toLowerCase().trim();

  // Simple substring match
  // TODO: Implement proper geocoding with Google Maps API or similar
  return (
    normalizedListingLocation.includes(normalizedTargetLocation) ||
    normalizedTargetLocation.includes(normalizedListingLocation)
  );
}
