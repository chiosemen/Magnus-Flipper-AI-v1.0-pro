export type Marketplace = "facebook" | "vinted" | "ebay" | "gumtree" | "depop";

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface IngestRunPayload {
  query: string;
  region: string;
  marketplaces?: Marketplace[];
  pagesPerMarketplace?: number;
  batchSize?: number;
}

export interface ScrapeJob {
  jobId: string;
  marketplace: Marketplace;
  query: string;
  region: string;
  page: number;
  batchSize: number;
  userId?: string;        // optional for manual runs
  savedSearchId?: string; // optional, present when from saved search
  tier?: "free" | "pro" | "premium"; // User tier (defaults to "free")
  traceId?: string; // For observability
}

export interface ParentJob {
  kind: "parent";
}

export interface JobProgress {
  totalBatches: number;
  doneBatches: number;
}

export interface JobStatusData {
  status: JobStatus;
  message: string;
  totalBatches: string;
  doneBatches: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  query: string;
  region: string;
  marketplace: "facebook";
  cron: string; // e.g. "*/30 * * * *"
  cronLabel?: string; // Human-readable: "Every 30 minutes"
  priceDropPct?: number; // Alert threshold (e.g. 10 = alert if -10%)
  paused: boolean;
  lastRun?: string; // ISO timestamp
  lastResultHash?: string; // SHA1 hash of last results
  trend?: "up" | "down" | "flat";
  createdAt: string;
  updatedAt: string;
}

export interface DealerJob {
  leadId: string;
  dealerId: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    mileage?: number;
    condition?: string;
  };
  location?: string;
  zip?: string;
  email?: string;
  phone?: string;
}
