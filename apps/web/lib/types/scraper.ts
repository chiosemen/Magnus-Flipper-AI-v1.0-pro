/**
 * Local Scraper Types
 * Decoupled from @magnus-flipper-ai/core
 */

export interface PerformanceSnapshot {
  marketplace: string;
  timestamp: string;
  metrics: {
    duration: number;
    listingsSaved: number;
    requestsMade: number;
    rateLimitHits: number;
    errors: number;
  };
  health: {
    status: "healthy" | "degraded" | "down";
    successRate: number;
    avgLatency: number;
    errorRate: number;
  };
}

export interface PerformanceSummary {
  totalItems: number;
  totalScrapers: number;
  averageSuccessRate: number;
  activeScrapers: number;
  totalErrors: number;
  snapshots: PerformanceSnapshot[];
  marketplaces?: string[];
  totalRuns: number;
  successfulRuns?: number;
  failedRuns?: number;
  avgSuccessRate: number;
  avgDuration: number;
  avgListingsPerRun: number;
}

export interface VelocityMetrics {
  marketplace: string;
  itemsPerMinute: number;
  itemsPerHour: number;
  peakVelocity: number;
  timestamp: string;
  avgVelocityScore: number;
  topVelocityListings: number;
  velocityTrend: Array<{
    timestamp: string;
    avgVelocity: number;
    count: number;
  }>;
}

export interface FingerprintStats {
  marketplace: string;
  totalFingerprints: number;
  uniqueFingerprints: number;
  duplicateRate: number;
  fingerprintDistribution: Array<{
    hashPrefix: string;
    count: number;
  }>;
  lastUpdated?: string;
}
