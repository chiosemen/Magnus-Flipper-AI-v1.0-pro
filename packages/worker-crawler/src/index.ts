import type { SearchFilter, MarketplaceSite } from "@magnus-flipper-ai/core";
import type { ScrapedListing } from "@magnus-flipper-ai/shared";
import * as VintedCrawler from "./crawlers/vinted";
import * as EbayCrawler from "./crawlers/ebay";
import * as GumtreeCrawler from "./crawlers/gumtree";

export async function crawlMarketplace(
  marketplace: MarketplaceSite,
  filter: SearchFilter
): Promise<ScrapedListing[]> {
  switch (marketplace) {
    case "VINTED":
      return VintedCrawler.crawl(filter);
    case "EBAY":
      return EbayCrawler.crawl(filter);
    case "GUMTREE":
      return GumtreeCrawler.crawl(filter);
    case "FB_MARKETPLACE":
      throw new Error("FB_MARKETPLACE crawler not yet implemented");
    case "CRAIGSLIST":
      throw new Error("CRAIGSLIST crawler not yet implemented");
    case "OFFERUP":
      throw new Error("OFFERUP crawler not yet implemented");
    default:
      throw new Error(`Unknown marketplace: ${marketplace}`);
  }
}

/**
 * Process a marketplace crawl job from the queue
 * This is the worker function that processes "marketplace-crawl" jobs
 */
export async function processMarketplaceCrawlJob(job: {
  data: {
    marketplace: "VINTED" | "EBAY" | "GUMTREE";
    query: string;
    options?: { page?: number };
  };
}): Promise<ScrapedListing[]> {
  const { marketplace, query, options } = job.data;

  console.log(`[Crawler:${marketplace}] Starting job for query="${query}"`);

  try {
    // Build filter from query and options
    const filter: SearchFilter = {
      category: query, // Use query as category for now
      models: query.split(" "), // Split query into model keywords
    };

    const listings = await crawlMarketplace(marketplace, filter);

    console.log(`[Crawler:${marketplace}] Completed job for query="${query}", found ${listings.length} listings`);

    return listings;
  } catch (error: any) {
    console.error(`[Crawler:${marketplace}] Job failed for query="${query}":`, error.message);
    // Log-only on failure, don't throw (idempotent)
    return [];
  }
}

export * from "./crawlers/vinted";
export * from "./crawlers/ebay";
export * from "./crawlers/gumtree";
