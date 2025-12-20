/**
 * Scraper Orchestrator
 * Manages execution of all marketplace scrapers
 */
import type { ScraperConfig, ScraperResult } from "../types/ScrapedListing.js";
export declare class ScraperOrchestrator {
    private ingestion;
    private monitor;
    private monitorModule;
    private supabaseUrl;
    private supabaseKey;
    constructor(supabaseUrl: string, supabaseKey: string);
    private ensureMonitor;
    /**
     * Run a specific marketplace scraper
     */
    runScraper(marketplace: string, config: ScraperConfig): Promise<ScraperResult>;
    /**
     * Run all marketplace scrapers concurrently
     */
    runAllScrapers(configs: Record<string, ScraperConfig>): Promise<ScraperResult[]>;
    /**
     * Get scraper instance for marketplace
     */
    private getScraperForMarketplace;
    /**
     * Get scraper health status
     */
    getHealthStatus(): Promise<any>;
    /**
     * Get performance statistics
     */
    getPerformanceStats(marketplace: string): Promise<any>;
}
//# sourceMappingURL=scraperOrchestrator.d.ts.map