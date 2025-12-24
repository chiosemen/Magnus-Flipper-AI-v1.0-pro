/**
 * Scraper Orchestrator
 * Manages execution of all marketplace scrapers
 */

import { FacebookMarketplaceScraper } from "../scrapers/facebookMarketplace.js";
import { CraigslistScraper } from "../scrapers/craigslist.js";
import { EbayScraper } from "../scrapers/ebay.js";
import { VintedScraper } from "../scrapers/vinted.js";
import { DepopScraper } from "../scrapers/depop.js";
import { GumtreeScraper } from "../scrapers/gumtree.js";
import { IngestionPipeline } from "../ingestion/pipeline.js";
import { IS_DB_LITE } from "../config/ingestionMode.js";
import type {
  ScraperConfig,
  ScraperResult,
} from "../types/ScrapedListing.js";
import type { SourcedScrapeResult } from "../types/pooling.js";
import {
  resolvePooledResult,
  detectAndLogAnomalies,
} from "./pooledResolver.js";
import { ApifySource } from "../sources/apifySource.js";

/**
 * Persist resolver decision to Supabase (non-blocking)
 */
async function persistResolverDecision(params: {
  marketplace: string;
  query?: string;
  apifyItems: number;
  diyItems: number;
  chosenSource: string;
  reason: string;
  confidence: number;
}): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return;
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the most recent run_id for this marketplace (if available)
    const { data: recentRun } = await supabase
      .from("scrape_runs")
      .select("id")
      .eq("marketplace", params.marketplace)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { error } = await supabase.from("resolver_decisions").insert({
      run_id: recentRun?.id || null,
      marketplace: params.marketplace,
      query: params.query || null,
      apify_items: params.apifyItems,
      diy_items: params.diyItems,
      chosen_source: params.chosenSource as "apify" | "diy" | "none",
      reason: params.reason,
      confidence: params.confidence,
    });

    if (error) {
      console.error("[RESOLVER] DB write error:", error);
    }
  } catch (error) {
    console.error("[RESOLVER] Error persisting decision:", error);
  }
}

/**
 * Get human-readable reason for resolver decision
 */
function getResolverReason(
  resolved: any,
  apifyResult: any,
  diyResult: any
): string {
  if (resolved.source === "apify" && apifyResult.listings.length > 0) {
    return "Apify returned items, preferred source";
  }
  if (resolved.source === "diy" && diyResult.listings.length > 0) {
    return "Apify returned zero, DIY fallback successful";
  }
  if (resolved.isDegraded) {
    return "Both sources returned zero results";
  }
  return "Default selection";
}

/**
 * Calculate confidence in resolver decision
 */
function calculateConfidence(
  resolved: any,
  apifyResult: any,
  diyResult: any
): number {
  if (resolved.isDegraded) {
    return 0.7; // Lower confidence when both fail
  }
  if (resolved.source === "apify" && apifyResult.listings.length > 0) {
    return 0.95; // High confidence when preferred source works
  }
  if (resolved.source === "diy" && diyResult.listings.length > 0) {
    return 0.8; // Good confidence in fallback
  }
  return 0.7; // Default confidence
}

// Lazy import ScraperMonitor to avoid loading Prisma in db-lite mode
type ScraperMonitorInstance = InstanceType<typeof import("@magnus-flipper-ai/core").ScraperMonitor>;

export class ScraperOrchestrator {
  private ingestion: IngestionPipeline | null;
  private monitor: ScraperMonitorInstance | null;
  private monitorModule: typeof import("@magnus-flipper-ai/core") | null = null;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    
    // Only initialize ingestion in db-full mode
    if (!IS_DB_LITE && supabaseUrl && supabaseKey) {
      this.ingestion = new IngestionPipeline(supabaseUrl, supabaseKey);
    } else {
      this.ingestion = null;
    }
    // Monitor is lazy-loaded to avoid Prisma import in db-lite mode
    this.monitor = null;
    this.monitorModule = null;
  }

  private async ensureMonitor(): Promise<ScraperMonitorInstance> {
    if (IS_DB_LITE) {
      throw new Error("ScraperMonitor should not be used in db-lite mode");
    }
    if (!this.monitor) {
      if (!this.monitorModule) {
        this.monitorModule = await import("@magnus-flipper-ai/core");
      }
      this.monitor = new this.monitorModule.ScraperMonitor(this.supabaseUrl, this.supabaseKey);
    }
    return this.monitor;
  }

  /**
   * Run a specific marketplace scraper with pooled resolution
   *
   * Phase 2: Runs both Apify (Source A) and DIY (Source B)
   * Resolver prefers Apify, falls back to DIY
   */
  async runScraper(
    marketplace: string,
    config: ScraperConfig
  ): Promise<ScraperResult> {
    const query = config.search_queries?.[0]; // Track first query for anomaly logging
    const sourcedResults: SourcedScrapeResult[] = [];

    try {
      // Phase 2: Run BOTH sources (Apify + DIY)
      // Run in parallel for performance (both are independent)
      const [apifyResult, diyResult] = await Promise.all([
        this.runApifyScraper(marketplace, config),
        this.runDiyScraper(marketplace, config),
      ]);

      // Tag with source metadata
      const sourcedApifyResult: SourcedScrapeResult = {
        ...apifyResult,
        source: "apify",
        query,
      };
      const sourcedDiyResult: SourcedScrapeResult = {
        ...diyResult,
        source: "diy",
        query,
      };

      sourcedResults.push(sourcedApifyResult, sourcedDiyResult);

      // Log source results
      console.log(
        `[SOURCE] apify returned ${apifyResult.listings.length} items for ${marketplace}`
      );
      console.log(
        `[SOURCE] diy returned ${diyResult.listings.length} items for ${marketplace}`
      );

      // Detect and log zero-results anomalies
      detectAndLogAnomalies(sourcedResults);

      // Resolve which source to use (Phase 1 logic - unchanged)
      const resolved = resolvePooledResult(sourcedResults);

      // Log degraded marketplace warning
      if (resolved.isDegraded) {
        console.warn(
          `[DEGRADED] Marketplace ${marketplace} returned zero results from all sources`
        );
      }

      console.log(
        `[RESOLVER] Selected source: ${resolved.source} for ${marketplace}`
      );

      // Persist resolver decision to database
      if (!IS_DB_LITE) {
        persistResolverDecision({
          marketplace,
          query,
          apifyItems: apifyResult.listings.length,
          diyItems: diyResult.listings.length,
          chosenSource: resolved.source,
          reason: getResolverReason(resolved, apifyResult, diyResult),
          confidence: calculateConfidence(resolved, apifyResult, diyResult),
        }).catch((error) => {
          console.error("[RESOLVER] Failed to persist decision:", error);
        });
      }

      // Use resolved result for ingestion
      const result = resolved.result;

      // If successful, ingest listings (only in db-full mode)
      if (!IS_DB_LITE && result.success && result.listings.length > 0 && this.ingestion) {
        console.log(`Ingesting ${result.listings.length} listings from ${marketplace}...`);

        const ingestStats = await this.ingestion.ingest(result.listings);

        console.log(
          `Ingestion complete: ${ingestStats.inserted} inserted, ${ingestStats.updated} updated, ${ingestStats.skipped} skipped, ${ingestStats.errors} errors`
        );

        // Mark stale listings
        const staleCount = await this.ingestion.markStaleListings(marketplace);
        console.log(`Marked ${staleCount} listings as stale for ${marketplace}`);
      }

      // Log result to telemetry (only in db-full mode)
      if (!IS_DB_LITE) {
        const monitor = await this.ensureMonitor();
        await monitor.logScraperRun(result);
      }

      return result;
    } catch (error: any) {
      console.error(`Error running ${marketplace} scraper:`, error);

      const errorResult: ScraperResult = {
        marketplace,
        success: false,
        listings: [],
        total_scraped: 0,
        errors: [error.message],
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: 0,
      };

      // Log result to telemetry (only in db-full mode)
      if (!IS_DB_LITE) {
        const monitor = await this.ensureMonitor();
        await monitor.logScraperRun(errorResult);
      }

      return errorResult;
    }
  }

  /**
   * Run DIY (in-house) scraper
   * Phase 1/2: Wraps existing scraper execution
   * NO SCRAPER LOGIC CHANGES - just execution wrapper
   */
  private async runDiyScraper(
    marketplace: string,
    config: ScraperConfig
  ): Promise<ScraperResult> {
    // Select appropriate scraper (existing logic - unchanged)
    const scraper = this.getScraperForMarketplace(marketplace, config);

    // Execute scraper (existing behavior - unchanged)
    return await scraper.scrape();
  }

  /**
   * Run Apify scraper (Source A)
   * Phase 2: New - wraps Apify Actor execution
   * NO DIY SCRAPER CHANGES - separate source
   */
  private async runApifyScraper(
    marketplace: string,
    config: ScraperConfig
  ): Promise<ScraperResult> {
    const apifySource = new ApifySource(config);
    return await apifySource.scrape();
  }

  /**
   * Run all marketplace scrapers concurrently
   */
  async runAllScrapers(
    configs: Record<string, ScraperConfig>
  ): Promise<ScraperResult[]> {
    const marketplaces = Object.keys(configs);

    console.log(`Running scrapers for ${marketplaces.length} marketplaces...`);

    // Run all scrapers in parallel
    const results = await Promise.all(
      marketplaces.map((marketplace) =>
        this.runScraper(marketplace, configs[marketplace])
      )
    );

    // Summary
    const successful = results.filter((r) => r.success).length;
    const totalScraped = results.reduce((sum, r) => sum + r.total_scraped, 0);

    console.log(
      `All scrapers completed: ${successful}/${results.length} successful, ${totalScraped} total items`
    );

    return results;
  }

  /**
   * Get scraper instance for marketplace
   */
  private getScraperForMarketplace(
    marketplace: string,
    config: ScraperConfig
  ): any {
    switch (marketplace.toLowerCase()) {
      case "facebook":
        return new FacebookMarketplaceScraper(config);
      case "craigslist":
        return new CraigslistScraper(config);
      case "ebay":
        return new EbayScraper(config);
      case "vinted":
        return new VintedScraper(config);
      case "depop":
        return new DepopScraper(config);
      case "gumtree":
        return new GumtreeScraper(config);
      default:
        throw new Error(`Unknown marketplace: ${marketplace}`);
    }
  }

  /**
   * Get scraper health status
   */
  async getHealthStatus(): Promise<any> {
    if (!IS_DB_LITE) {
      const monitor = await this.ensureMonitor();
      return await monitor.checkScraperHealth();
    }
    return { healthy: [], degraded: [], down: [] };
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(marketplace: string): Promise<any> {
    if (!IS_DB_LITE) {
      const monitor = await this.ensureMonitor();
      return await monitor.getPerformanceStats(marketplace);
    }
    return null;
  }
}
