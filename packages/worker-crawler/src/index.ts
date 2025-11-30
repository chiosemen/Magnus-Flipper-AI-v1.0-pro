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

export * from "./crawlers/vinted";
export * from "./crawlers/ebay";
export * from "./crawlers/gumtree";
