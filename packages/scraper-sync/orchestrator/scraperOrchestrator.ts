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
import { ScraperMonitor } from "@magnus-flipper-ai/core";
import type {
  ScraperConfig,
  ScraperResult,
} from "../types/ScrapedListing.js";

export class ScraperOrchestrator {
  private ingestion: IngestionPipeline;
  private monitor: ScraperMonitor;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.ingestion = new IngestionPipeline(supabaseUrl, supabaseKey);
    this.monitor = new ScraperMonitor(supabaseUrl, supabaseKey);
  }

  /**
   * Run a specific marketplace scraper
   */
  async runScraper(
    marketplace: string,
    config: ScraperConfig
  ): Promise<ScraperResult> {
    console.log(`Starting ${marketplace} scraper...`);

    let result: ScraperResult;

    try {
      // Select appropriate scraper
      const scraper = this.getScraperForMarketplace(marketplace, config);

      // Execute scraper
      result = await scraper.scrape();

      // If successful, ingest listings
      if (result.success && result.listings.length > 0) {
        console.log(`Ingesting ${result.listings.length} listings from ${marketplace}...`);

        const ingestStats = await this.ingestion.ingest(result.listings);

        console.log(
          `Ingestion complete: ${ingestStats.inserted} inserted, ${ingestStats.updated} updated, ${ingestStats.skipped} skipped, ${ingestStats.errors} errors`
        );

        // Mark stale listings
        const staleCount = await this.ingestion.markStaleListings(marketplace);
        console.log(`Marked ${staleCount} listings as stale for ${marketplace}`);
      }

      // Log result to telemetry
      await this.monitor.logScraperRun(result);
    } catch (error: any) {
      console.error(`Error running ${marketplace} scraper:`, error);

      result = {
        marketplace,
        success: false,
        listings: [],
        total_scraped: 0,
        errors: [error.message],
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: 0,
      };

      await this.monitor.logScraperRun(result);
    }

    return result;
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
    return await this.monitor.checkScraperHealth();
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(marketplace: string): Promise<any> {
    return await this.monitor.getPerformanceStats(marketplace);
  }
}
