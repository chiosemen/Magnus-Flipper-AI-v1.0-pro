import * as cheerio from "cheerio";
import type { RawListing } from "./types";

export function parseListings(html: string): RawListing[] {
  const $ = cheerio.load(html);
  const listings: RawListing[] = [];

  $(".s-item").each((_, element) => {
    try {
      const $item = $(element);
      const $link = $item.find(".s-item__link");
      const url = $link.attr("href") || "";
      const id = extractId(url);
      const title = $item.find(".s-item__title").text().trim();
      const priceText = $item.find(".s-item__price").text().trim();
      const price = parsePrice(priceText);
      const image = $item.find(".s-item__image-img").attr("src");
      const location = $item.find(".s-item__location").text().trim();
      const condition = $item.find(".SECONDARY_INFO").text().trim();

      if (id && title && url) {
        listings.push({
          id,
          title,
          price,
          url,
          image,
          location: location || undefined,
          condition: condition || undefined,
          postedAt: undefined,
        });
      }
    } catch (err) {
      console.error("Error parsing eBay listing:", err);
    }
  });

  return listings;
}

function extractId(url: string): string {
  const match = url.match(/\/itm\/(\d+)/);
  return match ? match[1] : "";
}

function parsePrice(priceText: string): number | null {
  const cleaned = priceText.replace(/[^\d.,]/g, "");
  const parsed = parseFloat(cleaned.replace(",", ""));
  return isNaN(parsed) ? null : parsed;
}
