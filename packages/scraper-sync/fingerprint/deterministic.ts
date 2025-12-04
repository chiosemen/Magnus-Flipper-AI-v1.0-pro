import { createHash } from "crypto";
import type { MarketListing } from "../types.js";

/**
 * Deterministic Fingerprint Generator
 * Creates unique hash based on listing characteristics
 */

export function generateDeterministicFingerprint(listing: MarketListing): string {
  const normalized = {
    title: normalizeTitle(listing.title),
    price: Math.round(listing.price),
    sellerId: listing.seller.id,
    source: listing.source,
  };

  const payload = JSON.stringify(normalized);
  return createHash("sha256").update(payload).digest("hex");
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateQuickFingerprint(
  title: string,
  price: number,
  sellerId: string
): string {
  const normalizedTitle = normalizeTitle(title);
  const roundedPrice = Math.round(price);
  const payload = `${normalizedTitle}:${roundedPrice}:${sellerId}`;
  return createHash("sha256").update(payload).digest("hex");
}

export function generatePriceRangeHash(price: number): string {
  const range = Math.floor(price / 10) * 10;
  return `price_range_${range}_${range + 10}`;
}
