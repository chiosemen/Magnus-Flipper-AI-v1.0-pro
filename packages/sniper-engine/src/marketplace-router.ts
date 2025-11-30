import { scrape as scrapeVinted } from "@magnus-flipper-ai/vinted-crawler";
import { scrape as scrapeEbay } from "@magnus-flipper-ai/ebay-crawler";
import { scrape as scrapeGumtree } from "@magnus-flipper-ai/gumtree-crawler";
import type { MarketplaceSite } from "@magnus-flipper-ai/core";

interface RouterResult {
  marketplace: string;
  listings: Array<{
    id: string;
    title: string;
    price: number | null;
    url: string;
    image?: string;
    location?: string;
    condition?: string;
    postedAt?: string;
  }>;
}

export async function routeMarketplaceScrape(
  marketplace: MarketplaceSite,
  query: string
): Promise<RouterResult> {
  switch (marketplace) {
    case "VINTED":
      return scrapeVinted(query);
    case "EBAY":
      return scrapeEbay(query);
    case "GUMTREE":
      return scrapeGumtree(query);
    case "FB_MARKETPLACE":
      throw new Error("FB_MARKETPLACE scraper not yet implemented");
    case "CRAIGSLIST":
      throw new Error("CRAIGSLIST scraper not yet implemented");
    case "OFFERUP":
      throw new Error("OFFERUP scraper not yet implemented");
    default:
      throw new Error(`Unknown marketplace: ${marketplace}`);
  }
}
