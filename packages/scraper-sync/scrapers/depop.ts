/**
 * Depop Scraper
 * Real implementation using Playwright for dynamic content
 */

import { Page } from "playwright";
import { BrowserManager } from "../utils/browserManager.js";
import type {
  ScrapedListing,
  ScraperConfig,
  ScraperResult,
} from "../types/ScrapedListing.js";

export class DepopScraper {
  private browserManager: BrowserManager;
  private config: ScraperConfig;
  private readonly BASE_URL = "https://www.depop.com";

  constructor(config: ScraperConfig) {
    this.browserManager = new BrowserManager();
    this.config = config;
  }

  async scrape(): Promise<ScraperResult> {
    const startTime = Date.now();
    const result: ScraperResult = {
      marketplace: "depop",
      success: false,
      listings: [],
      total_scraped: 0,
      errors: [],
      started_at: new Date().toISOString(),
      completed_at: "",
      duration_ms: 0,
    };

    let page: Page | null = null;

    try {
      await this.browserManager.launch(this.config);
      const context = await this.browserManager.createContext(this.config);
      page = await this.browserManager.createPage(context);

      for (const query of this.config.search_queries) {
        try {
          const listings = await this.scrapeQuery(page, query);
          result.listings.push(...listings);
        } catch (error: any) {
          result.errors.push(`Error scraping query "${query}": ${error.message}`);
        }
      }

      result.total_scraped = result.listings.length;
      result.success = result.listings.length > 0;
    } catch (error: any) {
      result.errors.push(`Depop scraper error: ${error.message}`);
    } finally {
      if (page) await page.close();
      await this.browserManager.close();
      result.completed_at = new Date().toISOString();
      result.duration_ms = Date.now() - startTime;
    }

    return result;
  }

  private async scrapeQuery(page: Page, query: string): Promise<ScrapedListing[]> {
    const listings: ScrapedListing[] = [];
    const searchUrl = `${this.BASE_URL}/search/?q=${encodeURIComponent(query)}`;

    await page.goto(searchUrl, { waitUntil: "networkidle" });
    await this.browserManager.randomDelay(2000, 3000);

    // Scroll to load more items
    await this.browserManager.infiniteScroll(page, this.config.max_pages * 2);

    // Extract listings
    const listingElements = await page.$$('li[data-testid="product"]');

    for (const element of listingElements.slice(0, this.config.max_pages * 20)) {
      try {
        const listing = await this.extractListingData(page, element);
        if (listing) listings.push(listing);
      } catch (error: any) {
        console.error(`Error extracting Depop listing: ${error.message}`);
      }
    }

    return listings;
  }

  private async extractListingData(page: Page, element: any): Promise<ScrapedListing | null> {
    try {
      const linkElement = await element.$('a[data-testid="product__link"]');
      if (!linkElement) return null;

      const href = await linkElement.getAttribute("href");
      const link = href?.startsWith("http") ? href : `${this.BASE_URL}${href}`;

      const titleElement = await element.$('p[data-testid="product__title"]');
      const title = titleElement ? (await titleElement.textContent())?.trim() || "Untitled" : "Untitled";

      const priceElement = await element.$('p[data-testid="product__price"]');
      const priceText = priceElement ? await priceElement.textContent() : "$0";
      const price = this.parsePrice(priceText || "$0");

      const imgElement = await element.$("img");
      const imgSrc = imgElement ? await imgElement.getAttribute("src") : null;
      const images = imgSrc ? [imgSrc] : [];

      const sellerElement = await element.$('p[data-testid="product__shop"]');
      const seller_name = sellerElement ? (await sellerElement.textContent())?.trim() : undefined;
      const seller_id = seller_name || this.extractIdFromUrl(link);

      return {
        title,
        price,
        currency: "USD",
        link,
        images,
        seller_id,
        seller_name,
        timestamp: new Date().toISOString(),
        condition: "unknown",
        marketplace: "depop",
      };
    } catch (error: any) {
      console.error(`Error extracting Depop listing data: ${error.message}`);
      return null;
    }
  }

  private parsePrice(priceText: string): number {
    const cleaned = priceText.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/products\/([^/]+)/);
    return match ? match[1] : Buffer.from(url).toString("base64").slice(0, 16);
  }
}
