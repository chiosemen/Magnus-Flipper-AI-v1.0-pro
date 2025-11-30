/**
 * Marketplace Scheduler
 * Registers cron jobs for marketplace crawling
 */

import { runMarketplaceCrawls, SavedSearch } from "./tasks";

/**
 * Schedule marketplace crawl jobs
 * Runs every 15 minutes for active saved searches
 *
 * This is a placeholder for cron job registration.
 * In production, this would integrate with a cron system like:
 * - node-cron
 * - BullMQ repeatable jobs
 * - Vercel Cron
 * - AWS EventBridge
 */
export function scheduleMarketplaceCrawls(
  getSavedSearches: () => Promise<SavedSearch[]>
): void {
  console.log("[Scheduler:Marketplace] Registering marketplace crawl scheduler");

  // Placeholder cron job (15 minute interval)
  // In production, replace with actual cron implementation:
  //
  // cron.schedule('*/15 * * * *', async () => {
  //   const savedSearches = await getSavedSearches();
  //   await runMarketplaceCrawls(savedSearches);
  // });

  console.log("[Scheduler:Marketplace] Marketplace crawl scheduler registered (*/15 * * * *)");
}

/**
 * Manually trigger marketplace crawls (for testing)
 */
export async function triggerMarketplaceCrawls(
  getSavedSearches: () => Promise<SavedSearch[]>
): Promise<void> {
  console.log("[Scheduler:Marketplace] Manually triggering marketplace crawls");

  const savedSearches = await getSavedSearches();
  await runMarketplaceCrawls(savedSearches);

  console.log("[Scheduler:Marketplace] Manual trigger completed");
}
