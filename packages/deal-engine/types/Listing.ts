import { z } from "zod";

/**
 * Raw marketplace listing schema
 * Normalized from various marketplace sources
 */
export const ListingSchema = z.object({
  id: z.string(),
  marketplace: z.string(),
  title: z.string(),
  description: z.string().optional(),
  price: z.number(),
  originalPrice: z.number().optional(),
  category: z.string().optional(),
  condition: z.enum(["new", "like-new", "excellent", "good", "fair", "poor", "unknown"]).default("unknown"),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
  location: z.string().optional(),
  postedAt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Listing = z.infer<typeof ListingSchema>;

/**
 * Extended listing with comparable sales data
 */
export interface EnrichedListing extends Listing {
  comparableSales?: ComparableSale[];
  msrp?: number;
  marketDemandScore?: number;
  categoryTrends?: CategoryTrend;
}

/**
 * Comparable sale data for market analysis
 */
export interface ComparableSale {
  title: string;
  price: number;
  soldDate: string;
  marketplace: string;
  condition: string;
}

/**
 * Category market trends
 */
export interface CategoryTrend {
  category: string;
  averagePrice: number;
  medianPrice: number;
  salesVolume: number;
  priceChange30d: number;
  demandScore: number;
}
