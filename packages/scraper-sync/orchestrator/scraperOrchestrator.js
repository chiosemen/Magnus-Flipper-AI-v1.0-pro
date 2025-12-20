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
export class ScraperOrchestrator {
    ingestion;
    monitor;
    monitorModule = null;
    supabaseUrl;
    supabaseKey;
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        // Only initialize ingestion in db-full mode
        if (!IS_DB_LITE && supabaseUrl && supabaseKey) {
            this.ingestion = new IngestionPipeline(supabaseUrl, supabaseKey);
        }
        else {
            this.ingestion = null;
        }
        // Monitor is lazy-loaded to avoid Prisma import in db-lite mode
        this.monitor = null;
        this.monitorModule = null;
    }
    async ensureMonitor() {
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
     * Run a specific marketplace scraper
     */
    async runScraper(marketplace, config) {
        let result;
        try {
            // Select appropriate scraper
            const scraper = this.getScraperForMarketplace(marketplace, config);
            // Execute scraper
            result = await scraper.scrape();
            // If successful, ingest listings (only in db-full mode)
            if (!IS_DB_LITE && result.success && result.listings.length > 0 && this.ingestion) {
                console.log(`Ingesting ${result.listings.length} listings from ${marketplace}...`);
                const ingestStats = await this.ingestion.ingest(result.listings);
                console.log(`Ingestion complete: ${ingestStats.inserted} inserted, ${ingestStats.updated} updated, ${ingestStats.skipped} skipped, ${ingestStats.errors} errors`);
                // Mark stale listings
                const staleCount = await this.ingestion.markStaleListings(marketplace);
                console.log(`Marked ${staleCount} listings as stale for ${marketplace}`);
            }
            // Log result to telemetry (only in db-full mode)
            if (!IS_DB_LITE) {
                const monitor = await this.ensureMonitor();
                await monitor.logScraperRun(result);
            }
        }
        catch (error) {
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
            // Log result to telemetry (only in db-full mode)
            if (!IS_DB_LITE) {
                const monitor = await this.ensureMonitor();
                await monitor.logScraperRun(result);
            }
        }
        return result;
    }
    /**
     * Run all marketplace scrapers concurrently
     */
    async runAllScrapers(configs) {
        const marketplaces = Object.keys(configs);
        console.log(`Running scrapers for ${marketplaces.length} marketplaces...`);
        // Run all scrapers in parallel
        const results = await Promise.all(marketplaces.map((marketplace) => this.runScraper(marketplace, configs[marketplace])));
        // Summary
        const successful = results.filter((r) => r.success).length;
        const totalScraped = results.reduce((sum, r) => sum + r.total_scraped, 0);
        console.log(`All scrapers completed: ${successful}/${results.length} successful, ${totalScraped} total items`);
        return results;
    }
    /**
     * Get scraper instance for marketplace
     */
    getScraperForMarketplace(marketplace, config) {
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
    async getHealthStatus() {
        if (!IS_DB_LITE) {
            const monitor = await this.ensureMonitor();
            return await monitor.checkScraperHealth();
        }
        return { healthy: [], degraded: [], down: [] };
    }
    /**
     * Get performance statistics
     */
    async getPerformanceStats(marketplace) {
        if (!IS_DB_LITE) {
            const monitor = await this.ensureMonitor();
            return await monitor.getPerformanceStats(marketplace);
        }
        return null;
    }
}
//# sourceMappingURL=scraperOrchestrator.js.map