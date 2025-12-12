import axios from "axios";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { Listing } from "./craigslist";

export async function scrapeListings(query: string = "electronics"): Promise<Listing[]> {
  try {
    const response = await axios.get(
      `https://www.gumtree.com/search?search_category=all&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MagnusFlipper/1.0)",
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    const listings: Listing[] = [];

    $(".listing-link").each((_: number, element: Element) => {
      const $el = $(element);
      const title = $el.find(".listing-title").text().trim();
      const priceText = $el.find(".listing-price").text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
      const url = "https://www.gumtree.com" + ($el.attr("href") || "");
      const imageUrl = $el.find("img").attr("src");

      if (title && url) {
        listings.push({
          marketplace: "gumtree",
          title,
          price,
          url,
          image_url: imageUrl,
          posted_at: new Date(),
          metadata: { query },
        });
      }
    });

    return listings.slice(0, 20);
  } catch (error) {
    console.error("Gumtree scrape error:", error);
    return [];
  }
}
