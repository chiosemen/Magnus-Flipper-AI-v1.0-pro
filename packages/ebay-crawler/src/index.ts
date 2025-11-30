import { fetchHtml } from "./fetch";
import { parseListings } from "./parse";
import { buildSearchUrl } from "./utils";
import type { ScrapeResult } from "./types";

export async function scrape(query: string): Promise<ScrapeResult> {
  const url = buildSearchUrl(query);
  const html = await fetchHtml(url);
  const listings = parseListings(html);

  return {
    marketplace: "EBAY",
    listings,
  };
}

export * from "./types";
