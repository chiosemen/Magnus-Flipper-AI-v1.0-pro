/**
 * Scraper Monitor Service
 * Tracks scraper health, performance, and failures
 *
 * This service is lightweight and only queries Supabase.
 * It does not include any browser automation dependencies.
 */
import type { ScraperResult, ScraperHealthMetrics } from "../types/scraper.js";
export declare class ScraperMonitor {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Log scraper execution
     */
    logScraperRun(result: ScraperResult): Promise<void>;
    /**
     * Update scraper health metrics
     */
    private updateHealthMetrics;
    /**
     * Get health metrics for all scrapers
     */
    getAllHealthMetrics(): Promise<ScraperHealthMetrics[]>;
    /**
     * Get health metrics for a specific marketplace
     */
    getHealthMetrics(marketplace: string): Promise<ScraperHealthMetrics | null>;
    /**
     * Get recent scraper logs
     */
    getRecentLogs(marketplace?: string, limit?: number): Promise<any[]>;
    /**
     * Get scraper performance statistics
     */
    getPerformanceStats(marketplace: string): Promise<any>;
    /**
     * Check if any scrapers are down
     */
    checkScraperHealth(): Promise<{
        healthy: string[];
        degraded: string[];
        down: string[];
    }>;
    /**
     * Alert if scrapers haven't run recently
     */
    checkStaleScrapers(hoursStale?: number): Promise<string[]>;
}
//# sourceMappingURL=scraperMonitor.d.ts.map