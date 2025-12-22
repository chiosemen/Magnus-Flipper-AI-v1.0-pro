// Correct clean exports for Magnus Core
export * from "./logger.js";
export * from "./env.js";
export * from "./search.js";
export * from "./plans.js";
export * from "./db.js";
export * from "./marketplaces.js";
export * from "./services/scrapeRunService.js";
export * from "./services/marketplaceControlService.js";

// scraper monitoring (public)
export { ScraperMonitor } from "./services/scraperMonitor.js";

// scraper-related shared types (public)
export type {
  ScraperHealthMetrics,
  ScraperResult,
} from "./types/scraper.js";

// Tier management
export * from "./tiers/tier-config.js";
export * from "./tiers/tier-service.js";

// Alerts
export * from "./alerts/alert-service.js";

// Analytics
export * from "./analytics/search-analytics.js";

// Contracts (feed-engine implements these)
export * from "./contracts/feed.js";

// MM Listing contracts
export * from "./contracts/mmListing.js";

// Health check utilities
export * from "./healthcheck.js";

// Elite Pool Economics
export * from "./services/eliteCoverage.js";
export * from "./services/eliteThrottlePolicy.js";

// Types exports
export * from "./types/index.js";
