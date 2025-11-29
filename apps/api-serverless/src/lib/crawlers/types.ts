/**
 * Shared types for marketplace crawlers
 */

export interface CrawlerSearchParams {
  query: string;
  category?: string;
  location?: {
    lat: number;
    lng: number;
    radius?: number; // miles
  };
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  maxResults?: number;
}

export interface CrawledListing {
  externalId: string;
  site: string;
  url: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  condition?: string;
  location?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  imageUrls?: string[];
  postedAt?: string;
  scrapedAt: string;
  metadata?: Record<string, any>;
}

export interface CrawlerResult {
  success: boolean;
  site: string;
  listings: CrawledListing[];
  errors?: string[];
  totalFound?: number;
  scrapedAt: string;
}
