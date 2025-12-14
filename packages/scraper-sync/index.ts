/**
 * @magnus-flipper-ai/scraper-sync
 * Live Marketplace Scraper Synchronization Engine
 */

// Types
export type {
  ScrapedListing,
  NormalizedListing,
  ScraperConfig,
  ScraperResult,
  ScraperHealthMetrics,
} from "./types/ScrapedListing.js";

// Re-export monitoring types from core
export type { ScraperHealthMetrics as CoreScraperHealthMetrics } from "@magnus-flipper-ai/core/types/scraper";

// Scrapers
export { FacebookMarketplaceScraper } from "./scrapers/facebookMarketplace.js";
export { CraigslistScraper } from "./scrapers/craigslist.js";
export { EbayScraper } from "./scrapers/ebay.js";
export { VintedScraper } from "./scrapers/vinted.js";
export { DepopScraper } from "./scrapers/depop.js";
export { GumtreeScraper } from "./scrapers/gumtree.js";

// Normalization
export { ListingNormalizer } from "./normalization/normalizer.js";

// Ingestion
export { IngestionPipeline } from "./ingestion/pipeline.js";

// Telemetry - re-export from core for backward compatibility
export { ScraperMonitor } from "@magnus-flipper-ai/core";

// Orchestrator
export { ScraperOrchestrator } from "./orchestrator/scraperOrchestrator.js";

// Utils
export { BrowserManager } from "./utils/browserManager.js";
