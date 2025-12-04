/**
 * Core Types for Scraper Sync Engine
 */

export type MarketplaceSource =
  | "offerup"
  | "craigslist"
  | "ebay"
  | "vinted"
  | "facebook"
  | "gumtree";

export interface MarketListing {
  id: string;
  source: MarketplaceSource;
  title: string;
  price: number;
  currency: "USD" | "GBP" | "EUR";
  images: string[];
  url: string;
  location: string;
  description?: string;
  condition?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    name?: string;
    rating?: number;
    verified?: boolean;
  };
  metadata: Record<string, any>;
}

export interface ListingFingerprint {
  deterministic: string; // hash(title + price + sellerId)
  fuzzy: {
    titleHash: string;
    imageHash?: string;
    priceRange: string;
    combinedScore: number;
  };
}

export interface DedupeResult {
  isNew: boolean;
  matchedListingId?: string;
  matchType?: "deterministic" | "fuzzy" | "none";
  confidence: number;
}

export interface SyncStats {
  marketplaceName: MarketplaceSource;
  itemsFetched: number;
  itemsNormalized: number;
  itemsDeduped: number;
  itemsInserted: number;
  itemsUpdated: number;
  errors: number;
  latencyMs: number;
  timestamp: string;
}

export interface SyncCycleResult {
  success: boolean;
  totalItems: number;
  totalInserted: number;
  totalUpdated: number;
  totalDeduped: number;
  marketplaceStats: SyncStats[];
  errors: Array<{ marketplace: string; error: string }>;
  cycleId: string;
  timestamp: string;
}
