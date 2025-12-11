/**
 * Tuning Metrics & Performance Logging
 * Tracks scraper performance, CPU usage, and optimization metrics
 */

import { logEvent } from "./telemetry";
import { recordScrapeRun } from "@magnus-flipper-ai/core/services/scrapeRunService";

export interface ScraperMetrics {
  marketplace: string;
  timestamp: number;
  duration: number;
  listingsFound: number;
  listingsSaved: number;
  requestsMade: number;
  rateLimitHits: number;
  errors: number;
  cpuTime?: number;
  memoryUsage?: number;
  throttleMultiplier?: number;
  burstModeUsed?: boolean;
  backoffActive?: boolean;
}

const metricsBuffer: ScraperMetrics[] = [];
const MAX_BUFFER_SIZE = 1000;

/**
 * Record scraper metrics
 */
export async function recordMetrics(metrics: ScraperMetrics): Promise<void> {
  metricsBuffer.push(metrics);

  // Flush buffer if it gets too large
  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    await flushMetrics();
  }

  // Log to telemetry
  await logEvent(metrics.marketplace, "scraper_metrics", {
    success: metrics.errors === 0,
    latency_ms: metrics.duration,
    payload: {
      listingsFound: metrics.listingsFound,
      listingsSaved: metrics.listingsSaved,
      requestsMade: metrics.requestsMade,
      rateLimitHits: metrics.rateLimitHits,
      errors: metrics.errors,
      cpuTime: metrics.cpuTime,
      memoryUsage: metrics.memoryUsage,
      throttleMultiplier: metrics.throttleMultiplier,
      burstModeUsed: metrics.burstModeUsed,
      backoffActive: metrics.backoffActive,
    },
  });
}

/**
 * Flush metrics buffer to storage
 */
export async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return;

  const batch = [...metricsBuffer];
  metricsBuffer.length = 0;

  // In production, this would write to a metrics database
  console.log(`[Metrics] Flushed ${batch.length} metrics entries`);
  
  // Log summary statistics
  const summary = calculateSummaryStats(batch);
  console.log(`[Metrics Summary]`, JSON.stringify(summary, null, 2));
}

/**
 * Calculate summary statistics from metrics
 */
function calculateSummaryStats(metrics: ScraperMetrics[]) {
  const byMarketplace = new Map<string, ScraperMetrics[]>();
  
  for (const metric of metrics) {
    if (!byMarketplace.has(metric.marketplace)) {
      byMarketplace.set(metric.marketplace, []);
    }
    byMarketplace.get(metric.marketplace)!.push(metric);
  }

  const summary: Record<string, any> = {};

  for (const [marketplace, marketplaceMetrics] of byMarketplace.entries()) {
    const total = marketplaceMetrics.length;
    const avgDuration = marketplaceMetrics.reduce((sum, m) => sum + m.duration, 0) / total;
    const totalListings = marketplaceMetrics.reduce((sum, m) => sum + m.listingsFound, 0);
    const totalRequests = marketplaceMetrics.reduce((sum, m) => sum + m.requestsMade, 0);
    const totalRateLimits = marketplaceMetrics.reduce((sum, m) => sum + m.rateLimitHits, 0);
    const totalErrors = marketplaceMetrics.reduce((sum, m) => sum + m.errors, 0);
    const avgThrottle = marketplaceMetrics
      .filter(m => m.throttleMultiplier !== undefined)
      .reduce((sum, m) => sum + (m.throttleMultiplier || 1.0), 0) / 
      (marketplaceMetrics.filter(m => m.throttleMultiplier !== undefined).length || 1);
    const burstUsage = marketplaceMetrics.filter(m => m.burstModeUsed).length;
    const backoffCount = marketplaceMetrics.filter(m => m.backoffActive).length;

    summary[marketplace] = {
      totalScans: total,
      avgDurationMs: Math.round(avgDuration),
      totalListingsFound: totalListings,
      totalRequests: totalRequests,
      totalRateLimits: totalRateLimits,
      totalErrors: totalErrors,
      successRate: ((total - totalErrors) / total * 100).toFixed(2) + '%',
      avgThrottleMultiplier: avgThrottle.toFixed(2),
      burstModeUsage: `${burstUsage}/${total} (${((burstUsage / total) * 100).toFixed(1)}%)`,
      backoffFrequency: `${backoffCount}/${total} (${((backoffCount / total) * 100).toFixed(1)}%)`,
      listingsPerRequest: (totalListings / totalRequests || 0).toFixed(2),
    };
  }

  return summary;
}

/**
 * Get CPU usage (Node.js process)
 */
export function getCpuUsage(): number {
  const usage = process.cpuUsage();
  const totalMicroseconds = usage.user + usage.system;
  return totalMicroseconds / 1000000; // Convert to seconds
}

/**
 * Get memory usage
 */
export function getMemoryUsage(): { heapUsed: number; heapTotal: number; external: number } {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
  };
}

/**
 * Periodic metrics flush (every 5 minutes)
 */
setInterval(() => {
  flushMetrics().catch(console.error);
}, 5 * 60 * 1000);
