import type { ScrapedListing } from "@magnus-flipper-ai/scrapers";

/**
 * Configuration for candidate selection
 */
export interface CandidateSelectionConfig {
  maxCandidates?: number; // Max number of candidates to select (default: 10)
  minConfidence?: number; // Minimum confidence threshold (default: 0.5)
  requireImage?: boolean; // Require image URL (default: false)
  requirePrice?: boolean; // Require price value (default: false)
}

const DEFAULT_CONFIG: Required<CandidateSelectionConfig> = {
  maxCandidates: 10,
  minConfidence: 0.5,
  requireImage: false,
  requirePrice: false,
};

/**
 * Score a listing for candidate selection
 * 
 * Scoring factors:
 * - Confidence score (from scraper)
 * - Has image (bonus)
 * - Has price (bonus)
 * - Title quality (length, keywords)
 */
function scoreListing(listing: ScrapedListing): number {
  let score = listing.confidence || 0;
  
  // Bonus for having image
  if (listing.imageUrl) {
    score += 0.2;
  }
  
  // Bonus for having price
  if (listing.priceValue !== undefined && listing.priceValue > 0) {
    score += 0.2;
  }
  
  // Bonus for title quality (longer titles often have more info)
  if (listing.title && listing.title.length > 20) {
    score += 0.1;
  }
  
  // Bonus for having location
  if (listing.locationText) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Select top candidates from discovered listings for Apify enrichment
 * 
 * Filters listings based on:
 * - Confidence threshold
 * - Image/price requirements
 * - Scores and ranks by quality
 */
export function selectTopCandidates(
  listings: ScrapedListing[],
  config: CandidateSelectionConfig = {}
): ScrapedListing[] {
  const {
    maxCandidates,
    minConfidence,
    requireImage,
    requirePrice,
  } = { ...DEFAULT_CONFIG, ...config };
  
  // Filter listings
  const filtered = listings.filter((listing) => {
    // Check confidence threshold
    if ((listing.confidence || 0) < minConfidence) {
      return false;
    }
    
    // Check image requirement
    if (requireImage && !listing.imageUrl) {
      return false;
    }
    
    // Check price requirement
    if (requirePrice && (listing.priceValue === undefined || listing.priceValue <= 0)) {
      return false;
    }
    
    return true;
  });
  
  // Score and sort
  const scored = filtered.map((listing) => ({
    listing,
    score: scoreListing(listing),
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  // Return top N
  return scored
    .slice(0, maxCandidates)
    .map((item) => item.listing);
}

