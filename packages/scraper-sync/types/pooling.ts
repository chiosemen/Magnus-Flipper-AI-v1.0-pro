/**
 * Phase 1: Pooled Ingestion Types
 *
 * This module defines the source pooling abstraction layer.
 * NO scraper behavior changes - only control-plane metadata.
 */

import type { ScrapedListing, ScraperResult } from "./ScrapedListing.js";

/**
 * Scrape source identifier
 * - apify: Apify Actor scraper (primary, more reliable against DOM drift)
 * - diy: DIY in-house scraper (fallback, prone to selector breakage)
 */
export type ScrapeSource = "apify" | "diy";

/**
 * Scrape result with source metadata
 * Wraps existing ScraperResult with source provenance
 */
export interface SourcedScrapeResult extends ScraperResult {
  source: ScrapeSource;
  query?: string; // The specific search query used
}

/**
 * Resolved scrape result after pooling logic
 * Contains the winning source and metadata about the decision
 */
export interface ResolvedScrapeResult {
  /** The winning source */
  source: ScrapeSource;

  /** The resolved result to use */
  result: ScraperResult;

  /** Whether this marketplace is degraded (all sources returned 0 items) */
  isDegraded: boolean;

  /** All source results that were considered */
  allResults: SourcedScrapeResult[];
}

/**
 * Zero-results anomaly log entry
 * Triggered when a scraper succeeds but returns no items
 */
export interface ZeroResultsAnomaly {
  type: "ZERO_RESULTS";
  source: ScrapeSource;
  marketplace: string;
  query?: string;
  timestamp: string;

  /** Additional context */
  duration_ms: number;
  errors: string[];
}

/**
 * Pooled scraper configuration
 * Extends base config with source preferences
 */
export interface PooledScraperConfig {
  /** Prefer Apify if available */
  preferApify?: boolean;

  /** Enable anomaly logging */
  logAnomalies?: boolean;

  /** Whether to run both sources for comparison (Phase 2+) */
  runBothSources?: boolean;
}
