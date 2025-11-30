export interface RawListing {
  id: string;
  title: string;
  price: number | null;
  url: string;
  image?: string;
  location?: string;
  condition?: string;
  postedAt?: string;
}

export interface ScrapeResult {
  marketplace: "EBAY";
  listings: RawListing[];
}
