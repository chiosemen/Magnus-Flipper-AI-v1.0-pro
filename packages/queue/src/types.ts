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
