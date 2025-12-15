import * as cheerio from "cheerio";

export interface OpenGraphData {
  ogTitle?: string;
  ogImage?: string;
  ogPriceAmount?: number;
  ogCurrency?: string;
}

export async function hydrateFromOpenGraph(url: string): Promise<OpenGraphData> {
  try {
    const res = await fetch(url, {
      headers: {
        // keep it boring; don't pretend to be someone else
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) return {};

    const html = await res.text();
    const $ = cheerio.load(html);

    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="og:image"]').attr("content");

    const ogTitle =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="og:title"]').attr("content");

    // price tags are inconsistent; keep flexible
    const price =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[property="og:price:amount"]').attr("content");

    const currency =
      $('meta[property="product:price:currency"]').attr("content") ||
      $('meta[property="og:price:currency"]').attr("content");

    return {
      ogTitle,
      ogImage,
      ogPriceAmount: price ? Number(price) : undefined,
      ogCurrency: currency,
    };
  } catch (error) {
    console.error("OpenGraph hydration error:", error);
    return {};
  }
}
