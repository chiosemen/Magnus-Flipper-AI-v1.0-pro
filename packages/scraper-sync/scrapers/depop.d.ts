/**
 * Depop Scraper
 * Real implementation using Playwright for dynamic content
 */
import type { ScraperConfig, ScraperResult } from "../types/ScrapedListing.js";
export declare class DepopScraper {
    private browserManager;
    private config;
    private readonly BASE_URL;
    constructor(config: ScraperConfig);
    scrape(): Promise<ScraperResult>;
    private scrapeQuery;
    private extractListingData;
    private parsePrice;
    private extractIdFromUrl;
}
//# sourceMappingURL=depop.d.ts.map