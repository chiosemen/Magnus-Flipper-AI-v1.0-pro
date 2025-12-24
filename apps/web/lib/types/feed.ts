/**
 * Local Feed Types
 * Decoupled from @magnus-flipper-ai/feed-engine
 */

export interface AggregatedListing {
  id: string;
  title: string | null;
  price: number | null;
  imageUrl: string | null;
  location: string | null;
  marketplace: string;
  url: string | null;
  firstSeen: Date | string;
  lastSeen?: Date | string;
  listingId?: string;
  rankingScore?: {
    listingId: string;
    velocityScore: number;
    freshnessScore: number;
    priceScore: number;
    engagementScore: number;
    finalScore: number;
  };
  fingerprint?: {
    contentHash: string;
    combinedHash: string;
  };
}

export interface FeedItem {
  id: string;
  title: string | null;
  price: number | null;
  imageUrl?: string | null;
  location?: string | null;
  marketplace: string;
  url: string | null;
  createdAt?: string;
  firstSeen?: Date | string;
  lastSeen?: Date | string;
  rankingScore?: {
    listingId: string;
    velocityScore: number;
    freshnessScore: number;
    priceScore: number;
    engagementScore: number;
    finalScore: number;
  };
  fingerprint?: {
    contentHash: string;
    combinedHash: string;
  };
}

export interface FeedFilters {
  marketplace?: string;
  marketplaces?: string[];
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
}

export type FeedViewMode = 'grid' | 'list' | 'paginated' | 'realtime' | 'hybrid';

export interface FeedResponse {
  items: AggregatedListing[];
  listings?: any[]; // Alias for items for compatibility
  total: number;
  page: number;
  pageSize: number;
  pagination?: {
    cursor?: string;
    nextCursor?: string;
    hasMore?: boolean;
  };
}

export interface FeedQueryParams {
  page?: number;
  pageSize?: number;
  limit?: number | string;
  cursor?: string;
  deduplicate?: string;
  rank?: string;
  marketplaces?: string;
  marketplace?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  search?: string;
}

export type FeedConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface RealtimeEvent {
  type: 'listing.new' | 'listing.updated' | 'listing.removed' | 'connected' | 'listings' | 'error' | 'closed';
  data?: AggregatedListing;
  listings?: AggregatedListing[];
  error?: string;
  timestamp: string;
}
