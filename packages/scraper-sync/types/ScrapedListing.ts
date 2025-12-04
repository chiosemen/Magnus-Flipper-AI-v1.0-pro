/**
 * Unified Scraped Listing Schema
 * All marketplace scrapers must output this format
 */

import { z } from "zod";

export const ScrapedListingSchema = z.object({
  // Core fields
  title: z.string(),
  price: z.number(),
  currency: z.string().default("USD"),
  link: z.string().url(),
  images: z.array(z.string().url()),

  // Seller information
  seller_id: z.string(),
  seller_name: z.string().optional(),
  seller_rating: z.number().optional(),
  seller_reviews_count: z.number().optional(),

  // Listing metadata
  timestamp: z.string(),
  location: z.string().optional(),
  condition: z.enum(["new", "like_new", "good", "fair", "poor", "unknown"]).default("unknown"),
  category: z.string().optional(),
  marketplace: z.enum(["facebook", "gumtree", "craigslist", "ebay", "vinted", "depop"]),

  // Additional fields
  description: z.string().optional(),
  shipping_available: z.boolean().optional(),
  shipping_cost: z.number().optional(),
  views_count: z.number().optional(),

  // Raw data for debugging
  raw_data: z.any().optional(),
});

export type ScrapedListing = z.infer<typeof ScrapedListingSchema>;

export const NormalizedListingSchema = ScrapedListingSchema.extend({
  // Normalized fields
  normalized_title: z.string(),
  normalized_price: z.number(),
  normalized_condition: z.string(),

  // Deduplication
  content_hash: z.string(),
  duplicate_group_id: z.string().optional(),

  // Freshness
  freshness_score: z.number().min(0).max(100),
  first_seen_at: z.string(),
  last_seen_at: z.string(),

  // Anomaly detection
  is_anomaly: z.boolean().default(false),
  anomaly_reason: z.string().optional(),
  anomaly_score: z.number().optional(),
});

export type NormalizedListing = z.infer<typeof NormalizedListingSchema>;

export interface ScraperConfig {
  marketplace: string;
  enabled: boolean;
  search_queries: string[];
  location?: string;
  max_price?: number;
  min_price?: number;
  categories?: string[];
  max_pages: number;
  delay_min_ms: number;
  delay_max_ms: number;
  use_proxy: boolean;
  proxy_list?: string[];
  headless: boolean;
  user_agent?: string;
  cookies?: any[];
  auth_credentials?: {
    email: string;
    password: string;
  };
}

export interface ScraperResult {
  marketplace: string;
  success: boolean;
  listings: ScrapedListing[];
  total_scraped: number;
  errors: string[];
  started_at: string;
  completed_at: string;
  duration_ms: number;
}

export interface ScraperHealthMetrics {
  marketplace: string;
  status: "healthy" | "degraded" | "down";
  last_run_at: string;
  last_success_at: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  avg_items_per_run: number;
  avg_duration_ms: number;
  error_rate: number;
  last_error?: string;
}
