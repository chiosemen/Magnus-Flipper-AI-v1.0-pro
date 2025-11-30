/**
 * Geo-Location Alert Evaluator
 * Evaluates if a listing is within a specific geographic area
 */

import type {
  GeoLocationConditions,
  ListingToEvaluate,
  EvaluationResult,
} from "../types";

/**
 * Evaluate geo-location condition
 */
export function evaluateGeoLocation(
  conditions: GeoLocationConditions,
  listing: ListingToEvaluate
): EvaluationResult {
  const { location, radius_km, country } = conditions;

  // Listing must have a location
  if (!listing.location) {
    return {
      triggered: false,
      trigger_reason: "Listing has no location",
    };
  }

  // Simple location matching (substring match)
  // TODO: In production, use geocoding API for proper distance calculation
  const normalizedListingLocation = listing.location.toLowerCase().trim();
  const normalizedTargetLocation = location.toLowerCase().trim();

  const locationMatches =
    normalizedListingLocation.includes(normalizedTargetLocation) ||
    normalizedTargetLocation.includes(normalizedListingLocation);

  if (!locationMatches) {
    return {
      triggered: false,
      trigger_reason: `Location "${listing.location}" does not match "${location}"`,
    };
  }

  // Country check (optional)
  if (country) {
    const countryMatches = normalizedListingLocation.includes(
      country.toLowerCase()
    );

    if (!countryMatches) {
      return {
        triggered: false,
        trigger_reason: `Location "${listing.location}" is not in country "${country}"`,
      };
    }
  }

  // Alert triggered!
  return {
    triggered: true,
    trigger_reason: `Listing location "${listing.location}" matches "${location}"${
      radius_km ? ` (within ${radius_km}km)` : ""
    }`,
    matched_listing: listing,
    metadata: {
      listing_location: listing.location,
      target_location: location,
      radius_km,
      country,
    },
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * TODO: Implement proper geocoding and distance calculation
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
