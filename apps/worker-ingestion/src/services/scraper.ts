/**
 * Scraper service that integrates with ScraperOrchestrator
 * Converts API search requests to ScraperConfig and executes scrapers
 */

import { ScraperOrchestrator } from "@magnus-flipper-ai/scraper-sync";
import type { ScraperConfig, ScraperResult } from "@magnus-flipper-ai/scraper-sync";
import { normalizeFacebookListing, type MMListing } from "@magnus-flipper-ai/core/contracts/mmListing";
import type { SearchResult, ListingItem } from "../types/schemas.js";
import { concurrencyManager } from "./concurrency.js";

// Valid marketplace enum
const VALID_MARKETPLACES = [
  "facebook",
  "gumtree",
  "vinted",
  "craigslist",
  "ebay",
  "depop",
] as const;

export type Marketplace = (typeof VALID_MARKETPLACES)[number];

export function isValidMarketplace(marketplace: string): marketplace is Marketplace {
  return VALID_MARKETPLACES.includes(marketplace as Marketplace);
}

/**
 * Convert API search request to ScraperConfig
 */
function searchToConfig(search: {
  marketplace: string;
  query: string;
  location?: string;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
  };
}): ScraperConfig {
  return {
    marketplace: search.marketplace,
    enabled: true,
    search_queries: [search.query],
    location: search.location,
    min_price: search.filters?.minPrice,
    max_price: search.filters?.maxPrice,
    categories: [],
    max_pages: 3, // Default to 3 pages
    delay_min_ms: 2000,
    delay_max_ms: 5000,
    use_proxy: false,
    headless: true,
  };
}

/**
 * Convert ScraperResult to SearchResult format
 * Normalizes Facebook listings to MM contract
 */
function resultToSearchResult(
  scraperResult: ScraperResult,
  searchId: string,
  query: string,
  location?: string,
  geo?: "US" | "UK"
): SearchResult {
  // For Facebook, normalize to MM contract
  if (scraperResult.marketplace === "facebook" && geo) {
    const normalizedListings: MMListing[] = scraperResult.listings.map((listing) =>
      normalizeFacebookListing(listing, geo)
    );

    // Convert MMListing to ListingItem format for backward compatibility
    const items: ListingItem[] = normalizedListings.map((listing) => ({
      title: listing.title,
      price: listing.price || 0,
      currency: listing.currency,
      location: listing.location,
      url: listing.url,
      images: listing.imageUrl ? [listing.imageUrl] : [],
      sellerName: listing.sellerName,
      postedAt: listing.scrapedAt,
    }));

    return {
      marketplace: scraperResult.marketplace,
      searchId,
      query,
      location,
      listingsFound: scraperResult.total_scraped,
      durationMs: scraperResult.duration_ms,
      items,
    };
  }

  // Fallback for other marketplaces
  const items: ListingItem[] = scraperResult.listings.map((listing) => ({
    title: listing.title,
    price: listing.price,
    currency: listing.currency || "USD",
    location: listing.location,
    url: listing.link,
    images: listing.images || [],
    sellerName: listing.seller_name,
    postedAt: listing.timestamp,
  }));

  return {
    marketplace: scraperResult.marketplace,
    searchId,
    query,
    location,
    listingsFound: scraperResult.total_scraped,
    durationMs: scraperResult.duration_ms,
    items,
  };
}

/**
 * Run a single search using the scraper orchestrator
 */
export async function runSearch(
  orchestrator: ScraperOrchestrator,
  search: {
    searchId: string;
    marketplace: string;
    query: string;
    location?: string;
    filters?: {
      minPrice?: number;
      maxPrice?: number;
    };
  },
  geo?: "US" | "UK"
): Promise<SearchResult> {
  const { marketplace, searchId, query, location } = search;

  // Validate marketplace
  if (!isValidMarketplace(marketplace)) {
    throw new Error(`Unknown marketplace: ${marketplace}`);
  }

  // Check concurrency
  if (!concurrencyManager.canStart(marketplace)) {
    throw new Error(
      `Concurrency limit reached for ${marketplace}. Max 10 concurrent tasks.`
    );
  }

  // Mark as active
  concurrencyManager.start(marketplace);

  try {
    // Convert to scraper config
    const config = searchToConfig(search);

    // Run scraper
    const scraperResult = await orchestrator.runScraper(marketplace, config);

    // Convert to API format (normalize Facebook listings if geo provided)
    const searchResult = resultToSearchResult(scraperResult, searchId, query, location, geo);

    return searchResult;
  } finally {
    // Always decrement concurrency
    concurrencyManager.finish(marketplace);
  }
}
