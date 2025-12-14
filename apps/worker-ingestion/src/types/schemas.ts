/**
 * Magnus Flipper v1 /mm-agent → worker API Contract
 * Typed request/response schemas
 */

import { z } from "zod";

// Request schemas
export const IngestRunRequestSchema = z.object({
  requestId: z.string().uuid(),
  initiatedBy: z.literal("mm-agent"),
  mode: z.literal("db-lite"),
  marketplaces: z.array(z.string()),
  geo: z.enum(["US", "UK"]).optional(),
  searches: z.array(
    z.object({
      searchId: z.string(),
      marketplace: z.string(),
      query: z.string(),
      location: z.string().optional(),
      filters: z
        .object({
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
        })
        .optional()
        .default({}),
    })
  ),
});

export type IngestRunRequest = z.infer<typeof IngestRunRequestSchema>;

// Response schemas
export const IngestRunResponseSchema = z.object({
  requestId: z.string().uuid(),
  status: z.literal("accepted"),
  startedAt: z.string(),
  estimatedDurationSec: z.number(),
});

export type IngestRunResponse = z.infer<typeof IngestRunResponseSchema>;

export const IngestStatusResponseSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["queued", "running", "completed", "partial", "failed"]),
  progress: z.object({
    total: z.number(),
    completed: z.number(),
    failed: z.number(),
  }),
  startedAt: z.string(),
  updatedAt: z.string(),
});

export type IngestStatusResponse = z.infer<typeof IngestStatusResponseSchema>;

export const ListingItemSchema = z.object({
  title: z.string(),
  price: z.number(),
  currency: z.string(),
  location: z.string().optional(),
  url: z.string().url(),
  images: z.array(z.string().url()),
  sellerName: z.string().optional(),
  postedAt: z.string(),
});

export type ListingItem = z.infer<typeof ListingItemSchema>;

export const SearchResultSchema = z.object({
  marketplace: z.string(),
  searchId: z.string(),
  query: z.string(),
  location: z.string().optional(),
  listingsFound: z.number(),
  durationMs: z.number(),
  items: z.array(ListingItemSchema),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const IngestResultsResponseSchema = z.object({
  requestId: z.string().uuid(),
  mode: z.literal("db-lite"),
  completedAt: z.string(),
  results: z.array(SearchResultSchema),
});

export type IngestResultsResponse = z.infer<typeof IngestResultsResponseSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  ingestionEnabled: z.boolean(),
  mode: z.literal("db-lite"),
  uptimeSec: z.number(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
