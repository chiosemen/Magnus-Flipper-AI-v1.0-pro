import { scrape } from "@magnus-flipper-ai/ebay-crawler";
import type { SearchFilter } from "@magnus-flipper-ai/core";
import type { ScrapedListing } from "@magnus-flipper-ai/shared";

export async function crawl(filter: SearchFilter): Promise<ScrapedListing[]> {
  const query = buildQuery(filter);
  const result = await scrape(query);

  return result.listings.map((listing) => ({
    marketplace: "EBAY" as const,
    external_id: listing.id,
    title: listing.title,
    price: listing.price,
    url: listing.url,
    image_url: listing.image,
    location: listing.location,
    condition: listing.condition,
    posted_at: listing.postedAt || null,
  }));
}

function buildQuery(filter: SearchFilter): string {
  const parts: string[] = [];

  if (filter.category) parts.push(filter.category);
  if (filter.manufacturer) parts.push(filter.manufacturer);
  if (filter.models && filter.models.length > 0) {
    parts.push(filter.models.join(" "));
  }

  return parts.join(" ").trim() || "items";
}
