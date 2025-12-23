/**
 * Local Scraper Types
 * Decoupled from @magnus-flipper-ai/core
 */

export interface PerformanceSnapshot {
  scraperId: string;
  marketplace: string;
  timestamp: string;
  itemsScraped: number;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
  status: 'active' | 'idle' | 'error';
}

export interface PerformanceSummary {
  totalItems: number;
  totalScrapers: number;
  averageSuccessRate: number;
  activeScrapers: number;
  totalErrors: number;
  snapshots: PerformanceSnapshot[];
}

export interface VelocityMetrics {
  marketplace: string;
  itemsPerMinute: number;
  itemsPerHour: number;
  peakVelocity: number;
  timestamp: string;
}

export interface FingerprintStats {
  total: number;
  unique: number;
  duplicates: number;
  successRate: number;
  lastUpdated: string;
}
