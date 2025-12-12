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
  duration: number; // milliseconds
  listingsFound: number;
  listingsSaved: number;
  requestsMade: number;
  rateLimitHits: number;
  errors: number;
  cpuTime?: number; // milliseconds
  memoryUsage?: number; // bytes
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
  duplicateRate: number; // 0-1
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
    successRate: number; // 0-1
    avgLatency: number; // milliseconds
    errorRate: number; // 0-1
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
