import { getMarketplaceSettings, saveListings, updateMarketplaceSync } from "./services/supabase.js";
import { logEvent } from "./services/telemetry.js";
import {
  tryConsume,
  registerBackoff,
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
import * as craigslist from "./marketplaces/craigslist.js";
import * as gumtree from "./marketplaces/gumtree.js";
import * as ebay from "./marketplaces/ebay.js";
import * as vinted from "./marketplaces/vinted.js";
import * as facebook from "./marketplaces/facebook.js";
import * as offerup from "./marketplaces/offerup.js";

const scrapers: Record<string, (query?: string) => Promise<any[]>> = {
  craigslist: craigslist.scrapeListings,
  gumtree: gumtree.scrapeListings,
  ebay: ebay.scrapeListings,
  vinted: vinted.scrapeListings,
  facebook: facebook.scrapeListings,
  offerup: offerup.scrapeListings,
};

// Simple per-process active counter for concurrency control
const activeByMarketplace = new Map<string, number>();

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

export async function runScheduledScan() {
  console.log("Starting scheduled scan...");

  const marketplaces = await getMarketplaceSettings();

  if (marketplaces.length === 0) {
    console.log("No enabled marketplaces found");
    return;
  }

  for (const marketplace of marketplaces) {
    await scanMarketplace(marketplace.marketplace);
  }

  console.log("Scheduled scan complete");
}

function isRateLimitError(err: unknown): boolean {
  if (!err) return false;

  const msg = String(
    (err as any).message ?? (err as any).toString?.() ?? ''
  ).toLowerCase();

  return (
    msg.includes('429') ||
    msg.includes('too many requests') ||
    msg.includes('rate limit')
  );
}

export async function scanMarketplace(marketplaceName: string) {
  const scraper = scrapers[marketplaceName];

  if (!scraper) {
    console.error(`No scraper found for ${marketplaceName}`);
    return;
  }

  const startTime = Date.now();
  const tier: UserTier = 'STARTER';

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

  // C. Verify marketplace config exists
  let profile;
  try {
    profile = getMarketplaceProfile(marketplaceName as MarketplaceId);
  } catch (err) {
    console.error(`Unknown marketplace profile: ${marketplaceName}`, err);
    return;
  }

  // D. Rate-limit check before hitting the site
  const rl = await tryConsume({
    marketplace: marketplaceName as MarketplaceId,
    ip: undefined, // Could be extracted from proxy config if available
    tier
  });

  if (!rl.allowed) {
    const delayMs = Math.max(rl.resetAt - Date.now(), 0);
    console.log(
      `Rate limit exceeded for ${marketplaceName}. Skipping scan. Will retry in ${Math.ceil(delayMs / 1000)}s`
    );
    await logEvent(marketplaceName, "scan_rate_limited", {
      success: false,
      latency_ms: 0,
      payload: {
        remaining: rl.remaining,
        resetAt: new Date(rl.resetAt).toISOString()
      }
    });
    
    // Record rate limit event
    await recordScrapeRun({
      marketplace: marketplaceName,
      tier: tier,
      durationMs: Date.now() - startTime,
      outcome: 'RATE_LIMIT',
      errorMessage: `Rate limit exceeded. ${rl.remaining} requests remaining. Resets at ${new Date(rl.resetAt).toISOString()}`
    });
    
    return;
  }

  // E. We're allowed to run → increment active counter
  incActive(marketplaceName);

  console.log(`Scanning ${marketplaceName}... (${rl.remaining} requests remaining, ${getActiveCount(marketplaceName)}/${maxConcurrency} active)`);

  try {
    const listings = await scraper();
    const latency = Date.now() - startTime;

    if (listings.length > 0) {
      await saveListings(listings);
      console.log(`Saved ${listings.length} listings from ${marketplaceName}`);
    }

    await updateMarketplaceSync(marketplaceName);

    await logEvent(marketplaceName, "scan_completed", {
      success: true,
      latency_ms: latency,
      payload: { count: listings.length },
    });

    // Record successful scrape
    await recordScrapeRun({
      marketplace: marketplaceName,
      tier: tier,
      durationMs: latency,
      outcome: 'SUCCESS'
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error(`Error scanning ${marketplaceName}:`, error);

    // If marketplace complained about rate limiting, register backoff
    const isRateLimit = isRateLimitError(error);
    if (isRateLimit) {
      await registerBackoff({
        marketplace: marketplaceName as MarketplaceId,
        ip: undefined,
        tier
      });

      console.log(
        `Rate limit error detected for ${marketplaceName}. Registered backoff. Cooldown: ${profile.cooldownSecondsOn429}s`
      );
    }

    await logEvent(marketplaceName, "scan_failed", {
      success: false,
      latency_ms: latency,
      payload: { error: errorMessage },
    });

    // Record failed scrape (either rate limit or other error)
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
