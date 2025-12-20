/**
 * Gumtree Scraper
 * Real implementation with pagination support
 */
import type { ScraperConfig, ScraperResult } from "../types/ScrapedListing.js";
export declare class GumtreeScraper {
    private browserManager;
    private config;
    private readonly BASE_URL;
    constructor(config: ScraperConfig);
    scrape(): Promise<ScraperResult>;
    private scrapeQuery;
    private extractListingsFromPage;
    private extractListingData;
    private buildSearchUrl;
    private parsePrice;
    private extractIdFromUrl;
}
//# sourceMappingURL=gumtree.d.ts.map