/**
 * Marketplace Scheduler Tasks
 * Defines recurring tasks for marketplace crawling
 */

import { enqueueMarketplaceCrawl } from "@magnus-flipper-ai/queue";

export interface SavedSearch {
  id: string;
  marketplace: "VINTED" | "EBAY" | "GUMTREE";
  query: string;
  active: boolean;
}

/**
 * Run marketplace crawl for all active saved searches
 * Called every 15 minutes by the scheduler
 */
export async function runMarketplaceCrawls(savedSearches: SavedSearch[]): Promise<void> {
  console.log(`[Scheduler:Marketplace] Running crawls for ${savedSearches.length} saved searches`);

  const marketplaceCrawls = savedSearches.filter(
    (search) =>
      search.active &&
      (search.marketplace === "VINTED" ||
        search.marketplace === "EBAY" ||
        search.marketplace === "GUMTREE")
  );

  console.log(`[Scheduler:Marketplace] Found ${marketplaceCrawls.length} marketplace searches to crawl`);

  for (const search of marketplaceCrawls) {
    try {
      const jobId = await enqueueMarketplaceCrawl({
        marketplace: search.marketplace,
        query: search.query,
        options: {},
      });

      if (jobId) {
        console.log(
          `[Scheduler:Marketplace] Enqueued ${search.marketplace} crawl for search ${search.id}: "${search.query}"`
        );
      }
    } catch (error: any) {
      console.error(
        `[Scheduler:Marketplace] Failed to enqueue ${search.marketplace} crawl for search ${search.id}:`,
        error.message
      );
    }
  }
}
