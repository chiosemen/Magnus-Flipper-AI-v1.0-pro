/**
 * Marketplace Crawl Queue
 * Handles job queuing for marketplace scraper workers
 */

import { enqueueJob, EnqueueOptions } from '../index';
import { MarketplaceCrawlJobData } from './marketplace.job';

export const MARKETPLACE_CRAWL_QUEUE = 'marketplace-crawl';

/**
 * Enqueue a marketplace crawl job
 * Jobs are idempotent and log-only on failure
 */
export async function enqueueMarketplaceCrawl(
  data: MarketplaceCrawlJobData,
  options?: EnqueueOptions
): Promise<string | null> {
  const jobId = await enqueueJob(MARKETPLACE_CRAWL_QUEUE, data, {
    attempts: options?.attempts || 3,
    delay: options?.delay || 0,
  });

  if (jobId) {
    console.log(
      `[Queue] Enqueued marketplace-crawl job ${jobId} for ${data.marketplace} query="${data.query}"`
    );
  }

  return jobId;
}

export * from './marketplace.job';
