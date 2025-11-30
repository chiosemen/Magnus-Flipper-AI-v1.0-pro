import type { SearchFilter } from "@magnus-flipper-ai/core";

export interface ScrapedListing {
  marketplace: "VINTED" | "EBAY" | "GUMTREE";
  external_id: string;
  title: string;
  price: number | null;
  url: string;
  image_url?: string;
  location?: string;
  condition?: string;
  posted_at?: string | null;
}

export interface CrawlerContract {
  crawl(filter: SearchFilter): Promise<ScrapedListing[]>;
}
