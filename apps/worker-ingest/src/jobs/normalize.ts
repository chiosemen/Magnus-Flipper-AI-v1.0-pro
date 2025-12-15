import type { ScrapedListing } from "@magnus-flipper-ai/scrapers";
import type { Marketplace } from "@magnus-flipper-ai/queue";

/**
 * Normalize scraped listing to Prisma Listing format
 */
export function normalizeListing(
  listing: ScrapedListing,
  marketplace: Marketplace
): {
  externalId: string;
  marketplace: string;
  title: string;
  description: string | null;
  price: number;
  location: string | null;
  url: string;
  imageUrl: string | null;
  metadata: Record<string, any>;
} {
  // Generate externalId from listingId or URL
  const externalId = listing.listingId || listing.id || listing.url;
  
  // Extract price value, default to 0 if not available
  const price = listing.priceValue || 0;
  
  // Build description from available fields
  const descriptionParts: string[] = [];
  if (listing.locationText) {
    descriptionParts.push(`Location: ${listing.locationText}`);
  }
  if (listing.sellerName) {
    descriptionParts.push(`Seller: ${listing.sellerName}`);
  }
  if (listing.priceText) {
    descriptionParts.push(`Price: ${listing.priceText}`);
  }
  const description = descriptionParts.length > 0 ? descriptionParts.join(" | ") : null;
  
  // Build metadata object
  const metadata: Record<string, any> = {
    source: listing.source,
    confidence: listing.confidence,
    scrapedAt: listing.scrapedAt,
    currency: listing.currency,
    imageHash: listing.imageHash,
  };
  
  if (listing.raw) {
    metadata.raw = listing.raw;
  }
  
  return {
    externalId,
    marketplace,
    title: listing.title,
    description,
    price,
    location: listing.locationText || null,
    url: listing.url,
    imageUrl: listing.imageUrl || null,
    metadata,
  };
}

/**
 * Normalize multiple listings
 */
export function normalizeListings(
  listings: ScrapedListing[],
  marketplace: Marketplace
): ReturnType<typeof normalizeListing>[] {
  return listings.map((listing) => normalizeListing(listing, marketplace));
}

