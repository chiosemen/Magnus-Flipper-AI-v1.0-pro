/**
 * Normalized listing interface for marketplace adapters
 */
export interface NormalizedListing {
  marketplace: 'facebook' | 'vinted';
  externalId: string;
  url: string;
  title: string;
  price: number;
  currency: string;
  locationText?: string;
  imageUrl?: string;
  sellerName?: string;
  description?: string;
  status: 'active' | 'sold' | 'removed' | 'unknown';
  raw: Record<string, any>;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

/**
 * Adapter interface that all marketplace adapters must implement
 */
export interface MarketplaceAdapter {
  /**
   * Discover listing URLs/IDs from a source
   * For MVP, this is not used (we use user-submitted URLs)
   */
  discover?(): Promise<string[]>;

  /**
   * Hydrate a listing from a URL
   * This is the core function that extracts listing data from a URL
   */
  hydrate(url: string): Promise<NormalizedListing | null>;

  /**
   * Emit/store a normalized listing to the database
   * This is handled by the worker, but adapters can provide this for direct use
   */
  emit?(listing: NormalizedListing): Promise<void>;
}

/**
 * Hydration result
 */
export interface HydrationResult {
  success: boolean;
  listing: NormalizedListing | null;
  error?: string;
}
