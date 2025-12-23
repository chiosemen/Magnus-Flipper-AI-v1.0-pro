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
}

export interface FeedItem {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  location?: string;
  marketplace: string;
  url: string;
  createdAt: string;
}

export interface FeedFilters {
  marketplace?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
}

export type FeedViewMode = 'grid' | 'list';

export interface FeedResponse {
  items: AggregatedListing[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FeedQueryParams {
  page?: number;
  pageSize?: number;
  marketplace?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export type FeedConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export interface RealtimeEvent {
  type: 'listing.new' | 'listing.updated' | 'listing.removed';
  data: AggregatedListing;
  timestamp: string;
}
