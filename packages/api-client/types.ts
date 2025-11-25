import { z } from "zod";
import {
  AlertRecordSchema,
  AlertsStatsSchema,
  BillingStatusSchema,
  ListingSchema,
  SavedSearchSchema,
} from "./validators";

export type SavedSearch = z.infer<typeof SavedSearchSchema>;
export type Listing = z.infer<typeof ListingSchema>;
export type AlertRecord = z.infer<typeof AlertRecordSchema>;
export type BillingStatus = z.infer<typeof BillingStatusSchema>;
export type AlertsStats = z.infer<typeof AlertsStatsSchema>;

export type ListingSource = Listing["source"];
export type BillingPlan = BillingStatus["plan"];

export type SavedSearchCreateRequest = SavedSearch;
export type SavedSearchUpdateRequest = Partial<SavedSearch>;

export interface ListingsFeedParams {
  page?: number;
  limit?: number;
}

export type SavedSearchListResponse = SavedSearch[];
export type SavedSearchResponse = SavedSearch;
export type ListingsFeedResponse = Listing[];
export type ListingResponse = Listing;
export type AlertsRecentResponse = AlertRecord[];
export type AlertsStatsResponse = AlertsStats;
export type BillingStatusResponse = BillingStatus;
export type HealthResponse = unknown;
