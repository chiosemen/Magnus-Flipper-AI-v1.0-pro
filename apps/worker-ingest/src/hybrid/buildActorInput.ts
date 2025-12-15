import type { ScrapedListing } from "@magnus-flipper-ai/scrapers";
import type { IngestJobPayload } from "../router/types.js";

/**
 * Build Apify actor input from job payload and top candidates
 * 
 * This transforms our internal format into the format expected by Apify actors.
 * The exact structure depends on the actor, but this provides a standard format.
 */
export function buildActorInput(
  payload: IngestJobPayload,
  topCandidates?: ScrapedListing[]
): Record<string, any> {
  const baseInput: Record<string, any> = {
    query: payload.query,
    region: payload.region,
    page: payload.page || 1,
    limit: payload.batchSize || 20,
  };
  
  // If we have top candidates from local discovery, include them for enrichment
  if (topCandidates && topCandidates.length > 0) {
    baseInput.enrichmentMode = true;
    baseInput.candidates = topCandidates.map((listing) => ({
      listingId: listing.listingId || listing.id,
      url: listing.url,
      title: listing.title,
      priceText: listing.priceText,
      imageUrl: listing.imageUrl,
    }));
  }
  
  return baseInput;
}

