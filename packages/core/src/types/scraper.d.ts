/**
 * Scraper Performance Types
 *
 * Shared TypeScript types for scraper performance monitoring
 * Used across web and worker platforms
 */
/**
 * Scraper Performance Metrics
 */
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
/**
 * Velocity Metrics
 */
export interface VelocityMetrics {
    marketplace: string;
    avgVelocityScore: number;
    topVelocityListings: number;
    velocityTrend: Array<{
        timestamp: string;
        avgVelocity: number;
        count: number;
    }>;
}
/**
 * Fingerprint Statistics
 */
export interface FingerprintStats {
    marketplace: string;
    totalFingerprints: number;
    uniqueFingerprints: number;
    duplicateRate: number;
    fingerprintDistribution: Array<{
        hashPrefix: string;
        count: number;
    }>;
}
/**
 * Scraper Performance Snapshot
 */
export interface PerformanceSnapshot {
    marketplace: string;
    timestamp: string;
    metrics: ScraperMetrics;
    velocity?: VelocityMetrics;
    fingerprints?: FingerprintStats;
    health: {
        status: "healthy" | "degraded" | "down";
        successRate: number;
        avgLatency: number;
        errorRate: number;
    };
}
/**
 * Scraper Performance Summary
 */
export interface PerformanceSummary {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgDuration: number;
    avgListingsPerRun: number;
    avgSuccessRate: number;
    marketplaces: string[];
}
/**
 * Performance Comparison
 */
export interface PerformanceComparison {
    marketplace: string;
    current: PerformanceSnapshot;
    previous?: PerformanceSnapshot;
    trend: "improving" | "stable" | "degrading";
    delta: {
        successRate: number;
        avgLatency: number;
        listingsPerRun: number;
    };
}
/**
 * Scraper Health Metrics
 * Used for monitoring scraper status and performance
 */
export interface ScraperHealthMetrics {
    marketplace: string;
    status: "healthy" | "degraded" | "down";
    last_run_at: string;
    last_success_at: string;
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    avg_items_per_run: number;
    avg_duration_ms: number;
    error_rate: number;
    last_error?: string;
}
/**
 * Scraper Result
 * Result of a scraper execution
 */
export interface ScraperResult {
    marketplace: string;
    success: boolean;
    listings: any[];
    total_scraped: number;
    errors: string[];
    started_at: string;
    completed_at: string;
    duration_ms: number;
}
//# sourceMappingURL=scraper.d.ts.map