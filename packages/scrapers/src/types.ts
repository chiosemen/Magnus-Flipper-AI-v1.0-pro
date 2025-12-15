export type ScrapedListing = {
  listingId: string;       // REQUIRED - stable, unique, deterministic
  id?: string;            // DEPRECATED - keep for backward compatibility
  title: string;
  url: string;
  priceText?: string;      // keep as string to avoid currency parsing hell
  currency?: string;
  priceValue?: number;     // optional numeric if parsed safely
  imageUrl?: string;
  imageHash?: string;      // SHA-1 hash of normalized image URL
  locationText?: string;
  sellerName?: string;
  scrapedAt: string;       // ISO
  source: "facebook";
  confidence: number;      // 0..1
  raw?: Record<string, any>;
};
