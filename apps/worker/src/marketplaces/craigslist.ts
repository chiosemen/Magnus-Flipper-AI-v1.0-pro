import axios from "axios";
import * as cheerio from "cheerio";

export interface Listing {
  marketplace: string;
  title: string;
  price: number;
  url: string;
  image_url?: string;
  posted_at?: Date;
  metadata?: any;
}

export async function scrapeListings(query: string = "electronics"): Promise<Listing[]> {
  try {
    const response = await axios.get(
      `https://sfbay.craigslist.org/search/sss?query=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MagnusFlipper/1.0)",
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    const listings: Listing[] = [];

    $(".result-row").each((_, element) => {
      const $el = $(element);
      const title = $el.find(".result-title").text().trim();
      const priceText = $el.find(".result-price").text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
      const url = $el.find(".result-title").attr("href") || "";
      const imageUrl = $el.find("img").attr("src");

      if (title && url) {
        listings.push({
          marketplace: "craigslist",
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
    console.error("Craigslist scrape error:", error);
    return [];
  }
}
