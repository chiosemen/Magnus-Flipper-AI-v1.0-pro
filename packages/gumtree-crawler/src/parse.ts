import * as cheerio from "cheerio";
import type { RawListing } from "./types";

export function parseListings(html: string): RawListing[] {
  const $ = cheerio.load(html);
  const listings: RawListing[] = [];

  $(".listing-maxi").each((_, element) => {
    try {
      const $item = $(element);
      const $link = $item.find("a.listing-link");
      const url = $link.attr("href") || "";
      const id = $item.attr("data-q") || extractId(url);
      const title = $item.find(".listing-title").text().trim();
      const priceText = $item.find(".listing-price").text().trim();
      const price = parsePrice(priceText);
      const image = $item.find(".listing-thumbnail img").attr("src");
      const location = $item.find(".listing-location").text().trim();
      const postedAt = $item.find(".listing-posted-date").text().trim();

      if (id && title && url) {
        listings.push({
          id,
          title,
          price,
          url: url.startsWith("http") ? url : `https://www.gumtree.com${url}`,
          image,
          location: location || undefined,
          condition: undefined,
          postedAt: postedAt || undefined,
        });
      }
    } catch (err) {
      console.error("Error parsing Gumtree listing:", err);
    }
  });

  return listings;
}

function extractId(url: string): string {
  const match = url.match(/\/(\d+)$/);
  return match ? match[1] : "";
}

function parsePrice(priceText: string): number | null {
  const cleaned = priceText.replace(/[^\d.,]/g, "");
  const parsed = parseFloat(cleaned.replace(",", ""));
  return isNaN(parsed) ? null : parsed;
}
