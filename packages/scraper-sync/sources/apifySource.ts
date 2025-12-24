/**
 * Phase 2: Apify Source Adapter
 *
 * Wraps Apify Actor execution as Source A in the pooled ingestion system.
 * CRITICAL: This is control-plane only - NO scraper logic changes.
 */

import type {
  ScrapedListing,
  ScraperResult,
  ScraperConfig,
} from "../types/ScrapedListing.js";

/**
 * Apify source adapter
 *
 * Phase 2: Stub implementation (Apify SDK integration pending)
 * This allows the architecture to be tested without Apify credentials
 */
export class ApifySource {
  private config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  /**
   * Execute Apify Actor for marketplace scraping
   *
   * Phase 2 Rules:
   * - Single marketplace per run
   * - Single query (first in array)
   * - Max 5 items
   * - Short timeout (30s)
   * - NO retries
   * - NEVER throw - return empty on failure
   *
   * @returns ScraperResult tagged with source: "apify"
   */
  async scrape(): Promise<ScraperResult> {
    const startTime = Date.now();
    const marketplace = this.config.marketplace;
    const query = this.config.search_queries?.[0] || "laptop";

    const result: ScraperResult = {
      marketplace,
      success: false,
      listings: [],
      total_scraped: 0,
      errors: [],
      started_at: new Date().toISOString(),
      completed_at: "",
      duration_ms: 0,
    };

    try {
      console.log(`[APIFY] Starting actor for ${marketplace}, query: ${query}`);

      // Phase 2: Stub - returns empty (Apify SDK not integrated yet)
      // TODO: Integrate Apify SDK when credentials available
      // const listings = await this.runApifyActor(marketplace, query);
      const listings: ScrapedListing[] = [];

      result.listings = listings;
      result.total_scraped = listings.length;
      result.success = listings.length > 0;

      console.log(`[APIFY] Completed: ${listings.length} items from ${marketplace}`);
    } catch (error: any) {
      // CRITICAL: Never throw - log and return empty
      console.error(`[APIFY] Error (non-fatal):`, error.message);
      result.errors.push(`Apify error: ${error.message}`);
      result.success = false;
    } finally {
      result.completed_at = new Date().toISOString();
      result.duration_ms = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Run Apify Actor (stub for Phase 2)
   *
   * When Apify SDK is integrated, this will:
   * 1. Initialize Apify client with API key
   * 2. Call marketplace-specific actor
   * 3. Normalize output to ScrapedListing[]
   * 4. Handle errors gracefully
   *
   * @private
   */
  private async runApifyActor(
    marketplace: string,
    query: string
  ): Promise<ScrapedListing[]> {
    // Stub implementation
    // TODO Phase 2+: Add Apify SDK integration
    //
    // const { ApifyClient } = await import("apify-client");
    // const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
    //
    // const actorId = this.getActorIdForMarketplace(marketplace);
    // const input = {
    //   queries: [query],
    //   maxItems: 5,
    //   timeout: 30000,
    //   ...this.config
    // };
    //
    // const run = await client.actor(actorId).call(input, { timeout: 30000 });
    // const { items } = await client.dataset(run.defaultDatasetId).listItems();
    //
    // return this.normalizeApifyOutput(items, marketplace);

    return [];
  }

  /**
   * Map marketplace to Apify Actor ID
   *
   * @private
   */
  private getActorIdForMarketplace(marketplace: string): string {
    const actorMap: Record<string, string> = {
      facebook: "apify/facebook-marketplace-scraper",
      craigslist: "apify/craigslist-scraper",
      ebay: "apify/ebay-scraper",
      // Add more as needed
    };

    const actorId = actorMap[marketplace.toLowerCase()];
    if (!actorId) {
      throw new Error(`No Apify actor configured for marketplace: ${marketplace}`);
    }

    return actorId;
  }

  /**
   * Normalize Apify output to ScrapedListing format
   *
   * Apify actors return different schemas per marketplace.
   * This normalizes them to our unified format.
   *
   * @private
   */
  private normalizeApifyOutput(
    items: any[],
    marketplace: string
  ): ScrapedListing[] {
    return items.map((item) => {
      // Normalize based on marketplace
      // This is a generic mapper - adjust per actor schema
      return {
        title: item.title || item.name || "Untitled",
        price: this.parsePrice(item.price),
        currency: item.currency || "USD",
        link: item.url || item.link || "",
        images: item.images || item.photos || [],
        seller_id: item.sellerId || item.seller?.id || "unknown",
        seller_name: item.sellerName || item.seller?.name,
        timestamp: item.timestamp || item.postedAt || new Date().toISOString(),
        location: item.location || item.address,
        condition: this.normalizeCondition(item.condition),
        marketplace: marketplace as any,
        description: item.description,
        shipping_available: item.shipping?.available,
        shipping_cost: item.shipping?.cost,
      };
    });
  }

  /**
   * Parse price from various formats
   * @private
   */
  private parsePrice(priceInput: any): number {
    if (typeof priceInput === "number") return priceInput;
    if (typeof priceInput === "string") {
      const cleaned = priceInput.replace(/[^0-9.]/g, "");
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  /**
   * Normalize condition strings
   * @private
   */
  private normalizeCondition(condition?: string): "new" | "like_new" | "good" | "fair" | "poor" | "unknown" {
    if (!condition) return "unknown";
    const lower = condition.toLowerCase();
    if (lower.includes("new")) return "new";
    if (lower.includes("like new") || lower.includes("excellent")) return "like_new";
    if (lower.includes("good")) return "good";
    if (lower.includes("fair")) return "fair";
    if (lower.includes("poor")) return "poor";
    return "unknown";
  }
}
