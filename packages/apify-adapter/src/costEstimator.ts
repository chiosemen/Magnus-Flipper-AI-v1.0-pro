/**
 * Cost estimation utilities for Apify actor runs
 * 
 * Note: These are rough estimates. Actual costs depend on:
 * - Apify plan tier
 * - Actor complexity
 * - Proxy usage
 * - Data transfer
 */

/**
 * Estimate cost per actor run (USD)
 * 
 * Rough estimates based on typical marketplace scraping:
 * - Base compute: ~$0.10 per minute
 * - Proxy (if used): ~$0.05 per minute
 * - Data transfer: negligible for most cases
 * 
 * @param estimatedMinutes Estimated run duration in minutes
 * @param usesProxy Whether the actor uses proxies
 */
export function estimateCostPerRun(
  estimatedMinutes: number,
  usesProxy: boolean = true
): number {
  const baseCostPerMinute = 0.10;
  const proxyCostPerMinute = usesProxy ? 0.05 : 0;
  
  const totalCostPerMinute = baseCostPerMinute + proxyCostPerMinute;
  
  return estimatedMinutes * totalCostPerMinute;
}

/**
 * Estimate cost for multiple runs
 */
export function estimateCostForRuns(
  runCount: number,
  estimatedMinutesPerRun: number,
  usesProxy: boolean = true
): number {
  return runCount * estimateCostPerRun(estimatedMinutesPerRun, usesProxy);
}

/**
 * Default estimated minutes per marketplace scrape
 * Conservative estimates for common marketplaces
 */
export const DEFAULT_ESTIMATED_MINUTES: Record<string, number> = {
  facebook: 2.0,
  vinted: 1.5,
  gumtree: 1.0,
  ebay: 1.5,
  depop: 1.0,
};

/**
 * Get default estimated minutes for a marketplace
 */
export function getDefaultEstimatedMinutes(marketplace: string): number {
  return DEFAULT_ESTIMATED_MINUTES[marketplace.toLowerCase()] || 2.0;
}

