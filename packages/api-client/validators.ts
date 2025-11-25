import { z } from "zod";

export const SavedSearchSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  category: z.string(),
  manufacturer: z.string(),
  models: z.array(z.string()),
  minPrice: z.number(),
  maxPrice: z.number(),
  radiusMiles: z.number(),
  location: z.string(),
  active: z.boolean(),
  createdAt: z.string().datetime().optional(),
});

export const ListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  image: z.string(),
  source: z.enum(["facebook", "craigslist", "offerup", "gumtree", "ebay"]),
  location: z.string(),
  postedAt: z.string().datetime(),
  url: z.string().optional(),
});

export const AlertRecordSchema = z.object({
  id: z.string(),
  saved_search_id: z.string(),
  listing_id: z.string(),
  matchedAt: z.string().datetime(),
});

export const BillingStatusSchema = z.object({
  plan: z.enum(["STARTER", "BASIC", "PREMIUM", "ULTRA", "TRIAL"]).optional(),
  status: z.string().optional(),
  trial_expires_at: z.string().datetime().optional(),
  subscription_current_period_end: z.string().datetime().optional(),
});

export const AlertsStatsSchema = z.object({
  totalAlerts: z.number(),
  lastMatch: z.string().datetime().optional(),
});

export const SavedSearchArraySchema = z.array(SavedSearchSchema);
export const ListingArraySchema = z.array(ListingSchema);
export const AlertRecordArraySchema = z.array(AlertRecordSchema);
