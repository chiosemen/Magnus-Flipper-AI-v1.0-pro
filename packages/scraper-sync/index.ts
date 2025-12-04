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

// Telemetry
export { ScraperMonitor } from "./telemetry/monitor.js";

// Orchestrator
export { ScraperOrchestrator } from "./orchestrator/scraperOrchestrator.js";

// Utils
export { BrowserManager } from "./utils/browserManager.js";
