import { scrape } from "@magnus-flipper-ai/craigslist-crawler";
import type { SearchFilter } from "@magnus-flipper-ai/core";
import type { ScrapedListing } from "@magnus-flipper-ai/shared";

export async function crawl(filter: SearchFilter): Promise<ScrapedListing[]> {
  const params = buildSearchParams(filter);
  const result = await scrape(params);

  return result.listings.map((listing) => ({
    marketplace: "CRAIGSLIST" as const,
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

function buildSearchParams(filter: SearchFilter) {
  const params: any = {
    query: buildQuery(filter),
    category: filter.category,
  };

  if (filter.minPrice) params.minPrice = filter.minPrice;
  if (filter.maxPrice) params.maxPrice = filter.maxPrice;

  if (filter.locationCity || (filter.locationLat && filter.locationLng)) {
    params.location = {
      city: filter.locationCity,
      lat: filter.locationLat,
      lng: filter.locationLng,
      radius: filter.radiusMiles,
    };
  }

  return params;
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
