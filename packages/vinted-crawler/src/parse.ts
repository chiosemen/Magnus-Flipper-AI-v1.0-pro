import * as cheerio from "cheerio";
import type { RawListing } from "./types";

export function parseListings(html: string): RawListing[] {
  const $ = cheerio.load(html);
  const listings: RawListing[] = [];

  $(".feed-grid__item").each((_, element) => {
    try {
      const $item = $(element);
      const $link = $item.find("a.new-item-box__overlay");
      const id = $link.attr("data-item-id") || "";
      const url = $link.attr("href") || "";
      const title = $item.find(".new-item-box__title").text().trim();
      const priceText = $item.find(".new-item-box__price").text().trim();
      const price = parsePrice(priceText);
      const image = $item.find("img.new-item-box__image").attr("src");
      const location = $item.find(".new-item-box__subtitle").text().trim();

      if (id && title && url) {
        listings.push({
          id,
          title,
          price,
          url: url.startsWith("http") ? url : `https://www.vinted.com${url}`,
          image,
          location: location || undefined,
          condition: undefined,
          postedAt: undefined,
        });
      }
    } catch (err) {
      console.error("Error parsing Vinted listing:", err);
    }
  });

  return listings;
}

function parsePrice(priceText: string): number | null {
  const cleaned = priceText.replace(/[^\d.,]/g, "");
  const parsed = parseFloat(cleaned.replace(",", "."));
  return isNaN(parsed) ? null : parsed;
}
