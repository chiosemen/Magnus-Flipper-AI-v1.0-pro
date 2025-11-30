/**
 * Marketplace Crawl Job Type Definition
 */

export interface MarketplaceCrawlJobData {
  marketplace: "VINTED" | "EBAY" | "GUMTREE";
  query: string;
  options?: {
    page?: number;
  };
}

export interface MarketplaceCrawlJob {
  id: string;
  type: "marketplace-crawl";
  data: MarketplaceCrawlJobData;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}
