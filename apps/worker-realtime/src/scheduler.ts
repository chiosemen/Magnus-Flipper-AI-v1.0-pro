import { getMarketplaceSettings, saveListings, updateMarketplaceSync } from "./services/supabase";
import { logEvent } from "./services/telemetry";
import { recordMetrics, getCpuUsage, getMemoryUsage } from "./services/metrics";
import {
  tryConsume,
  registerBackoff,
  getCurrentBackoffSeconds,
  getAdaptiveThrottleMultiplier,
  recordRequestOutcome,
  UserTier
} from '@magnus-flipper-ai/rate-limiter';
import {
  MarketplaceId,
  getMarketplaceProfile
} from '@magnus-flipper-ai/marketplace-config';
import {
  recordScrapeRun
} from '@magnus-flipper-ai/core/services/scrapeRunService';
import {
  getMarketplaceEffectiveControl
} from '@magnus-flipper-ai/core/services/marketplaceControlService';
import {
  validateCompliance,
} from '@magnus-flipper-ai/compliance-shield';
import { ensureScanEntitlement } from "./lib/entitlements";
import * as craigslist from "./marketplaces/craigslist";
import * as gumtree from "./marketplaces/gumtree";
import * as ebay from "./marketplaces/ebay";
import * as vinted from "./marketplaces/vinted";
import * as facebook from "./marketplaces/facebook";
import * as offerup from "./marketplaces/offerup";

const scrapers: Record<string, (query?: string) => Promise<any[]>> = {
  craigslist: craigslist.scrapeListings,
  gumtree: gumtree.scrapeListings,
  ebay: ebay.scrapeListings,
  vinted: vinted.scrapeListings,
  facebook: facebook.scrapeListings,
  offerup: offerup.scrapeListings,
};

// Per-marketplace active counter for concurrency control
const activeByMarketplace = new Map<string, number>();

// Daily request counters (reset at midnight UTC)
const dailyRequestCounts = new Map<string, number>();
let lastResetDate = new Date().toISOString().split('T')[0];

function resetDailyCountersIfNeeded() {
  const today = new Date().toISOString().split('T')[0];
  if (today !== lastResetDate) {
    dailyRequestCounts.clear();
    lastResetDate = today;
  }
}

function getActiveCount(marketplace: string): number {
  return activeByMarketplace.get(marketplace) ?? 0;
}

function incActive(marketplace: string) {
  activeByMarketplace.set(
    marketplace,
    getActiveCount(marketplace) + 1
  );
}

function decActive(marketplace: string) {
  const current = getActiveCount(marketplace);
  if (current <= 1) {
    activeByMarketplace.delete(marketplace);
  } else {
    activeByMarketplace.set(marketplace, current - 1);
  }
}

function getDailyRequestCount(marketplace: string): number {
  resetDailyCountersIfNeeded();
  return dailyRequestCounts.get(marketplace) ?? 0;
}

function incDailyRequestCount(marketplace: string) {
  resetDailyCountersIfNeeded();
  const current = getDailyRequestCount(marketplace);
  dailyRequestCounts.set(marketplace, current + 1);
}

function isRateLimitError(err: unknown): boolean {
  if (!err) return false;

  const msg = String(
    (err as any).message ?? (err as any).toString?.() ?? ''
  ).toLowerCase();

  return (
    msg.includes('429') ||
    msg.includes('too many requests') ||
    msg.includes('rate limit') ||
    msg.includes('quota exceeded')
  );
}

/**
 * Risk-tier based scheduling
 * High-risk marketplaces get longer delays and stricter limits
 */
function getSchedulingDelay(profile: any, hasBackoff: boolean): number {
  if (hasBackoff) {
    return 0; // Backoff is applied separately
  }

  const baseDelay = profile.recommendedPingIntervalSeconds * 1000;
  const jitter = profile.jitterSeconds * 1000 * (Math.random() * 2 - 1); // ±jitter
  const delay = Math.max(0, baseDelay + jitter);

  // Risk-tier multiplier
  const riskMultipliers: Record<string, number> = {
    low: 0.8,
    medium: 1.0,
    high: 1.5,
    critical: 2.0,
  };
  const multiplier = riskMultipliers[profile.riskLevel] || 1.0;

  return Math.floor(delay * multiplier);
}

/**
 * Burst-mode fetcher: Execute multiple requests in burst window
 * Respects burst limits from marketplace profile
 */
async function executeBurstFetch(
  marketplace: string,
  scraper: (query?: string) => Promise<any[]>,
  burstSize: number
): Promise<any[]> {
  const results: any[] = [];
  const errors: Error[] = [];

  // Execute burst requests in parallel (up to burst size)
  const promises = Array.from({ length: burstSize }, async () => {
    try {
      const listings = await scraper();
      return listings;
    } catch (error) {
      errors.push(error as Error);
      return [];
    }
  });

  const batchResults = await Promise.allSettled(promises);
  
  for (const result of batchResults) {
    if (result.status === 'fulfilled') {
      results.push(...result.value);
    }
  }

  // Log errors if any
  if (errors.length > 0) {
    console.warn(`Burst fetch for ${marketplace} had ${errors.length} errors`);
  }

  return results;
}

/**
 * CPU-safe parser: Process listings in batches to avoid blocking
 * Enhanced with adaptive batch sizing and CPU monitoring
 */
async function processListingsInBatches<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
): Promise<void> {
  // Adaptive batch sizing based on CPU usage
  let currentBatchSize = batchSize;
  const cpuUsage = getCpuUsage();
  
  // Reduce batch size if CPU is high
  if (cpuUsage > 0.8) {
    currentBatchSize = Math.max(10, Math.floor(batchSize * 0.5));
  } else if (cpuUsage < 0.3) {
    // Increase batch size if CPU is low
    currentBatchSize = Math.min(100, Math.floor(batchSize * 1.5));
  }

  for (let i = 0; i < items.length; i += currentBatchSize) {
    const batch = items.slice(i, i + currentBatchSize);
    await processor(batch);
    
    // Yield to event loop every batch to prevent blocking
    // Use setImmediate for better event loop yielding
    if (i + currentBatchSize < items.length) {
      await new Promise((resolve) => setImmediate(resolve));
      
      // Additional yield if CPU is high
      if (getCpuUsage() > 0.7) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }
}

export async function scanMarketplace(marketplaceName: string) {
  const scraper = scrapers[marketplaceName];

  if (!scraper) {
    console.error(`No scraper found for ${marketplaceName}`);
    return;
  }

  const startTime = Date.now();
  const cpuStart = getCpuUsage();
  const memStart = getMemoryUsage();
  const tier: UserTier = 'STARTER';
  let requestsMade = 0;
  let rateLimitHits = 0;
  let errors = 0;

  // 1) Load effective admin control for this marketplace
  const control = await getMarketplaceEffectiveControl(marketplaceName);

  // A. If disabled: skip and record
  if (!control.enabled) {
    console.log(
      `Marketplace ${marketplaceName} is disabled via admin control. Skipping scan.`
    );
    await logEvent(marketplaceName, "scan_disabled", {
      success: false,
      latency_ms: 0,
      payload: { reason: 'Marketplace disabled via admin control' }
    });

    await recordScrapeRun({
      marketplace: marketplaceName,
      tier: tier,
      durationMs: Date.now() - startTime,
      outcome: 'ERROR',
      errorMessage: 'Marketplace disabled via admin control'
    });

    return;
  }

  // B. Soft concurrency cap (per worker process)
  const maxConcurrency = control.maxConcurrency;
  const currentActive = getActiveCount(marketplaceName);

  if (currentActive >= maxConcurrency) {
    console.log(
      `Marketplace ${marketplaceName} at concurrency cap (${currentActive}/${maxConcurrency}). Skipping scan.`
    );
    await logEvent(marketplaceName, "scan_deferred", {
      success: false,
      latency_ms: 0,
      payload: {
        active: currentActive,
        maxConcurrency: maxConcurrency
      }
    });

    await recordScrapeRun({
      marketplace: marketplaceName,
      tier: tier,
      durationMs: Date.now() - startTime,
      outcome: 'ERROR',
      errorMessage: `Deferred: active=${currentActive}, maxConcurrency=${maxConcurrency}`
    });

    return;
  }

  // C. Entitlement gate (hard stop)
  const entitlementUserId = process.env.WORKER_ENTITLEMENT_USER_ID;
  const entitlement = await ensureScanEntitlement(
    entitlementUserId,
    marketplaceName
  );

  if (!entitlement.ok) {
    console.log(
      `Entitlement blocked for ${marketplaceName}: ${entitlement.reason}`
    );
    await logEvent(marketplaceName, "scan_entitlement_blocked", {
      success: false,
      latency_ms: 0,
      payload: { reason: entitlement.reason },
    });

    await recordScrapeRun({
      marketplace: marketplaceName,
      tier: tier,
      durationMs: Date.now() - startTime,
      outcome: "ERROR",
      errorMessage: `Entitlement blocked: ${entitlement.reason}`,
    });

    return;
  }

  // D. Verify marketplace config exists
  let profile;
  try {
    profile = getMarketplaceProfile(marketplaceName as MarketplaceId);
  } catch (err) {
    console.error(`Unknown marketplace profile: ${marketplaceName}`, err);
    return;
  }

  // D. Compliance validation
  const dailyCount = getDailyRequestCount(marketplaceName);
  const compliance = validateCompliance(
    profile,
    dailyCount,
    !!process.env.PROXY_URL, // Simplified: check if proxy env var exists
    false // Simplified: check if cookies exist
  );

  if (!compliance.compliant) {
    console.warn(
      `Compliance check failed for ${marketplaceName}: ${compliance.reason}`
    );
    await logEvent(marketplaceName, "scan_compliance_failed", {
      success: false,
      latency_ms: 0,
      payload: { reason: compliance.reason }
    });
    return;
  }

  // E. Check backoff status
  const backoffSeconds = await getCurrentBackoffSeconds({
    marketplace: marketplaceName as MarketplaceId,
    ip: undefined,
    tier
  });

  const baseInterval = profile.recommendedPingIntervalSeconds;
  const backoffActive = backoffSeconds > baseInterval;
  
  if (backoffActive) {
    // We're in backoff, check if enough time has passed
    const backoffKey = `backoff:${marketplaceName}`;
    const lastBackoffTime = (global as any)[backoffKey] || 0;
    const timeSinceBackoff = Date.now() - lastBackoffTime;
    const backoffMs = backoffSeconds * 1000;

    if (timeSinceBackoff < backoffMs) {
      const remainingMs = backoffMs - timeSinceBackoff;
      console.log(
        `Marketplace ${marketplaceName} in backoff. Remaining: ${Math.ceil(remainingMs / 1000)}s`
      );
      return;
    }
  }

  // F. Adaptive throttling: Get current throttle multiplier (with guardrails)
  const throttleMultiplier = await getAdaptiveThrottleMultiplier({
    marketplace: marketplaceName as MarketplaceId,
    ip: undefined,
    tier
  });
  
  // Guardrails are applied inside getAdaptiveThrottleMultiplier
  // This ensures we never exceed safe limits

  // G. Rate-limit check before hitting the site
  const rl = await tryConsume({
    marketplace: marketplaceName as MarketplaceId,
    ip: undefined,
    tier
  });

  if (!rl.allowed) {
    rateLimitHits++;
    const delayMs = Math.max(rl.resetAt - Date.now(), 0);
    console.log(
      `Rate limit exceeded for ${marketplaceName}. Skipping scan. Will retry in ${Math.ceil(delayMs / 1000)}s`
    );
    await logEvent(marketplaceName, "scan_rate_limited", {
      success: false,
      latency_ms: 0,
      payload: {
        remaining: rl.remaining,
        resetAt: new Date(rl.resetAt).toISOString(),
        burstRemaining: rl.burstRemaining,
      }
    });
    
    await recordScrapeRun({
      marketplace: marketplaceName,
      tier: tier,
      durationMs: Date.now() - startTime,
      outcome: 'RATE_LIMIT',
      errorMessage: `Rate limit exceeded. ${rl.remaining} requests remaining. Resets at ${new Date(rl.resetAt).toISOString()}`
    });
    
    return;
  }

  // H. Apply adaptive throttling delay if multiplier < 1.0
  if (throttleMultiplier < 1.0) {
    const baseDelay = profile.recommendedPingIntervalSeconds * 1000;
    const throttleDelay = baseDelay * (1.0 / throttleMultiplier - 1.0);
    console.log(
      `Applying adaptive throttle for ${marketplaceName}: ${throttleMultiplier.toFixed(2)}x (delay: ${Math.ceil(throttleDelay / 1000)}s)`
    );
    await new Promise((resolve) => setTimeout(resolve, throttleDelay));
  }

  // I. We're allowed to run → increment active counter
  incActive(marketplaceName);
  incDailyRequestCount(marketplaceName);

  console.log(
    `Scanning ${marketplaceName}... (${rl.remaining} requests remaining, ${rl.burstRemaining} burst remaining, ${getActiveCount(marketplaceName)}/${maxConcurrency} active, throttle: ${throttleMultiplier.toFixed(2)}x)`
  );

  try {
    // J. Determine if we should use burst mode
    const useBurst = !!(profile.burstMaxRequests > 1 && rl.burstRemaining && rl.burstRemaining > 0);
    const burstSize = useBurst
      ? Math.min(profile.burstMaxRequests, rl.burstRemaining || 1)
      : 1;

    let listings: any[];

    if (useBurst && burstSize > 1) {
      // Burst mode: Fetch multiple pages in parallel
      console.log(`Using burst mode for ${marketplaceName}: ${burstSize} parallel requests`);
      requestsMade = burstSize;
      listings = await executeBurstFetch(marketplaceName, scraper, burstSize);
    } else {
      // Single request
      requestsMade = 1;
      listings = await scraper();
    }

    const latency = Date.now() - startTime;
    const cpuTime = getCpuUsage() - cpuStart;
    const memUsage = getMemoryUsage();

    // K. CPU-safe batch processing
    if (listings.length > 0) {
      const batchSize = 50; // Process 50 listings at a time
      await processListingsInBatches(listings, batchSize, async (batch) => {
        await saveListings(batch);
      });
      console.log(`Saved ${listings.length} listings from ${marketplaceName} (processed in batches of ${batchSize})`);
    }

    await updateMarketplaceSync(marketplaceName);

    // Record success for adaptive throttling
    await recordRequestOutcome({
      marketplace: marketplaceName as MarketplaceId,
      ip: undefined,
      tier
    }, true);

    // Record metrics
    await recordMetrics({
      marketplace: marketplaceName,
      timestamp: Date.now(),
      duration: latency,
      listingsFound: listings.length,
      listingsSaved: listings.length,
      requestsMade,
      rateLimitHits,
      errors: 0,
      cpuTime,
      memoryUsage: memUsage.heapUsed,
      throttleMultiplier,
      burstModeUsed: useBurst,
      backoffActive,
    });

    await logEvent(marketplaceName, "scan_completed", {
      success: true,
      latency_ms: latency,
      payload: {
        count: listings.length,
        burstMode: useBurst,
        burstSize: useBurst ? burstSize : 1,
        throttleMultiplier,
        cpuTime,
        memoryUsage: memUsage.heapUsed,
      },
    });

    await recordScrapeRun({
      marketplace: marketplaceName,
      tier: tier,
      durationMs: latency,
      outcome: 'SUCCESS'
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    const cpuTime = getCpuUsage() - cpuStart;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    errors++;

    console.error(`Error scanning ${marketplaceName}:`, error);

    // Record failure for adaptive throttling
    await recordRequestOutcome({
      marketplace: marketplaceName as MarketplaceId,
      ip: undefined,
      tier
    }, false);

    // If marketplace complained about rate limiting, register backoff
    const isRateLimit = isRateLimitError(error);
    if (isRateLimit) {
      rateLimitHits++;
      const backoffSeconds = await registerBackoff({
        marketplace: marketplaceName as MarketplaceId,
        ip: undefined,
        tier
      });

      const backoffKey = `backoff:${marketplaceName}`;
      (global as any)[backoffKey] = Date.now();

      console.log(
        `Rate limit error detected for ${marketplaceName}. Registered backoff: ${backoffSeconds}s (with jitter)`
      );
    }

    // Record metrics
    await recordMetrics({
      marketplace: marketplaceName,
      timestamp: Date.now(),
      duration: latency,
      listingsFound: 0,
      listingsSaved: 0,
      requestsMade,
      rateLimitHits,
      errors,
      cpuTime,
      throttleMultiplier,
      burstModeUsed: false,
      backoffActive: isRateLimit,
    });

    await logEvent(marketplaceName, "scan_failed", {
      success: false,
      latency_ms: latency,
      payload: {
        error: errorMessage,
        isRateLimit,
        cpuTime,
      },
    });

    await recordScrapeRun({
      marketplace: marketplaceName,
      tier: tier,
      durationMs: latency,
      outcome: isRateLimit ? 'RATE_LIMIT' : 'ERROR',
      errorMessage: errorMessage
    });
  } finally {
    // Always decrement active counter
    decActive(marketplaceName);
  }
}

/**
 * Get scheduling delay for risk-tier based scheduling
 */
export async function getNextScanDelay(marketplaceName: string): Promise<number> {
  try {
    const profile = getMarketplaceProfile(marketplaceName as MarketplaceId);
    const backoffSeconds = await getCurrentBackoffSeconds({
      marketplace: marketplaceName as MarketplaceId,
      ip: undefined,
      tier: 'STARTER'
    });

    const hasBackoff = backoffSeconds > profile.recommendedPingIntervalSeconds;
    return getSchedulingDelay(profile, hasBackoff);
  } catch {
    return 300000; // Default 5 minutes
  }
}
