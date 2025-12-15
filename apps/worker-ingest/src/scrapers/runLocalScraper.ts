import type { Marketplace } from "@magnus-flipper-ai/queue";
import type { ScrapedListing } from "@magnus-flipper-ai/scrapers";
import { scrapeFacebookHybrid } from "@magnus-flipper-ai/scrapers/facebook";

/**
 * Input for running a local scraper
 */
export interface LocalScraperInput {
  marketplace: Marketplace;
  query: string;
  region: string;
  page?: number;
  batchSize?: number;
}

/**
 * Result from local scraper
 */
export interface LocalScraperResult {
  listings: ScrapedListing[];
  source: "html" | "playwright" | "unknown";
}

/**
 * Run local scraper for a marketplace
 * 
 * Currently supports:
 * - Facebook (via hybrid scraper)
 * 
 * Other marketplaces can be added here as scrapers are implemented.
 */
export async function runLocalScraper(
  input: LocalScraperInput
): Promise<LocalScraperResult> {
  const { marketplace, query, region, page = 1, batchSize = 20 } = input;
  
  switch (marketplace) {
    case "facebook": {
      const result = await scrapeFacebookHybrid({
        query,
        region,
        page,
        batchSize,
      });
      
      return {
        listings: result.listings,
        source: result.source,
      };
    }
    
    case "vinted":
    case "gumtree":
    case "ebay":
    case "depop":
      // TODO: Implement scrapers for these marketplaces
      // For now, return empty result
      console.warn(`Local scraper not yet implemented for ${marketplace}`);
      return {
        listings: [],
        source: "unknown",
      };
    
    default:
      throw new Error(`Unknown marketplace: ${marketplace}`);
  }
}

