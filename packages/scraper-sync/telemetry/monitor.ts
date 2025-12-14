/**
 * Telemetry and Monitoring Module
 * 
 * @deprecated This file is kept for backward compatibility only.
 * Please import ScraperMonitor from @magnus-flipper-ai/core instead.
 * 
 * This re-exports the monitor from core to avoid breaking existing imports.
 */

// Re-export from core
export { ScraperMonitor } from "@magnus-flipper-ai/core";

// Re-export types for backward compatibility
export type { ScraperHealthMetrics } from "@magnus-flipper-ai/core/types/scraper";
export type { ScraperResult } from "../types/ScrapedListing.js";
