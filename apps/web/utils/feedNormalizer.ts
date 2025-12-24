/**
 * Feed Normalization Utility
 * 
 * Normalizes FeedItem to AggregatedListing at data-fetch boundaries.
 * This ensures UI components always receive AggregatedListing with required fields.
 */

import type { FeedItem } from "@/lib/types/feed";
import type { AggregatedListing } from "@/lib/types/feed";

/**
 * Normalize FeedItem to AggregatedListing
 * Provides safe defaults for required fields (rankingScore, fingerprint)
 * Converts date strings to Date objects as required by AggregatedListing
 */
export function normalizeFeedItemToAggregated(
  item: FeedItem
): AggregatedListing {
  // Convert date strings to Date objects if needed
  const firstSeen = item.firstSeen 
    ? (item.firstSeen instanceof Date ? item.firstSeen : new Date(item.firstSeen))
    : new Date();
  const lastSeen = item.lastSeen 
    ? (item.lastSeen instanceof Date ? item.lastSeen : new Date(item.lastSeen))
    : undefined;

  return {
    ...item,
    firstSeen,
    lastSeen,
    imageUrl: item.imageUrl ?? null,
    location: item.location ?? null,
    url: item.url ?? null,
    rankingScore: item.rankingScore ?? {
      listingId: item.id,
      velocityScore: 0,
      freshnessScore: 0,
      priceScore: 0,
      engagementScore: 0,
      finalScore: 0,
    },
    fingerprint: item.fingerprint ?? {
      contentHash: "",
      combinedHash: "",
    },
  };
}

/**
 * Normalize an array of FeedItems to AggregatedListings
 */
export function normalizeFeedItemsToAggregated(
  items: FeedItem[]
): AggregatedListing[] {
  return items.map(normalizeFeedItemToAggregated);
}
