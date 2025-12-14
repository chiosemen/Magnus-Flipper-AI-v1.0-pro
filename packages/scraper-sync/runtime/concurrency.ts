/**
 * Concurrency Controller
 * Uses p-queue to enforce hard concurrency limits per marketplace
 */

import PQueue from 'p-queue';

const queues = new Map<string, PQueue>();

/**
 * Get or create a queue for a marketplace
 * Each marketplace has its own isolated queue with a hard limit of 10 concurrent tasks
 */
export function getMarketplaceQueue(marketplace: string): PQueue {
  if (!queues.has(marketplace)) {
    queues.set(
      marketplace,
      new PQueue({
        concurrency: 10,   // Hard limit: 10 concurrent tasks per marketplace
        intervalCap: 10,   // Rate smoothing
        interval: 1000
      })
    );
  }

  return queues.get(marketplace)!;
}
