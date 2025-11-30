export * from "./sync";

import { processMarketplaceCrawlJob } from "@magnus-flipper-ai/worker-crawler";
import { upsertListings } from "./sync/upsert";
import { processAlertsForListings } from "./alert-processor";
import type { MarketplaceCrawlJobData } from "@magnus-flipper-ai/queue";

/**
 * Process marketplace crawl job and sync results to database
 * This is the main entry point for queue workers processing marketplace crawl jobs
 */
export async function processAndSyncMarketplaceCrawl(
  job: { data: MarketplaceCrawlJobData }
): Promise<{ success: boolean; listingsCount: number; alertsTriggered: number }> {
  console.log(
    `[WorkerAnalyzer] Processing marketplace crawl job for ${job.data.marketplace}`
  );

  try {
    // Step 1: Crawl marketplace using worker-crawler
    const scrapedListings = await processMarketplaceCrawlJob(job);

    // Step 2: Sync listings to database using worker-analyzer
    if (scrapedListings.length > 0) {
      console.log(
        `[WorkerAnalyzer] Syncing ${scrapedListings.length} listings to database`
      );
      await upsertListings(scrapedListings);
      console.log(`[WorkerAnalyzer] Sync completed successfully`);
    } else {
      console.log(`[WorkerAnalyzer] No listings to sync (empty result)`);
    }

    // Step 3: Process alerts for scraped listings
    if (scrapedListings.length > 0) {
      console.log(`[WorkerAnalyzer] Processing alerts for scraped listings`);
      await processAlertsForListings(job.data.marketplace, scrapedListings);
      console.log(`[WorkerAnalyzer] Alert processing completed`);
    }

    return {
      success: true,
      listingsCount: scrapedListings.length,
      alertsTriggered: 0, // TODO: Return actual count from processAlertsForListings
    };
  } catch (error: any) {
    console.error(`[WorkerAnalyzer] Job processing failed:`, error.message);
    // Log-only on failure (idempotent, graceful fallback)
    return {
      success: false,
      listingsCount: 0,
      alertsTriggered: 0,
    };
  }
}
