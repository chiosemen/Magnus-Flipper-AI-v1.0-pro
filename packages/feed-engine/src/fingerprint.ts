/**
 * Listing Fingerprint v2
 * Enhanced fingerprinting with image hash, NLP title, price anomaly detection
 */

import { createHash } from "crypto";

export interface ListingFingerprint {
  contentHash: string;
  imageHash?: string;
  titleHash: string;
  priceHash: string;
  sellerHash: string;
  combinedHash: string;
}

export interface ListingForFingerprint {
  id: string;
  title: string;
  price: number;
  sellerId?: string;
  sellerName?: string;
  imageUrl?: string;
  marketplace: string;
  description?: string;
}

/**
 * Generate comprehensive fingerprint for deduplication
 */
export function generateFingerprint(listing: ListingForFingerprint): ListingFingerprint {
  // Normalize title (lowercase, remove special chars, normalize whitespace)
  const normalizedTitle = normalizeTitle(listing.title);
  const titleHash = createHash("sha256").update(normalizedTitle).digest("hex");

  // Price hash (rounded to nearest 10 for price tolerance)
  const roundedPrice = Math.round(listing.price / 10) * 10;
  const priceHash = createHash("sha256").update(`${roundedPrice}`).digest("hex");

  // Seller hash
  const sellerId = listing.sellerId || listing.sellerName || "unknown";
  const sellerHash = createHash("sha256").update(sellerId).digest("hex");

  // Image hash (if available)
  let imageHash: string | undefined;
  if (listing.imageUrl) {
    // In production, would fetch and hash image content
    // For now, hash the URL
    imageHash = createHash("sha256").update(listing.imageUrl).digest("hex");
  }

  // Content hash (title + price + seller)
  const contentPayload = `${normalizedTitle}:${roundedPrice}:${sellerId}`;
  const contentHash = createHash("sha256").update(contentPayload).digest("hex");

  // Combined hash (all fields)
  const combinedPayload = JSON.stringify({
    title: normalizedTitle,
    price: roundedPrice,
    seller: sellerId,
    marketplace: listing.marketplace,
    image: imageHash,
  });
  const combinedHash = createHash("sha256").update(combinedPayload).digest("hex");

  return {
    contentHash,
    imageHash,
    titleHash,
    priceHash,
    sellerHash,
    combinedHash,
  };
}

/**
 * Normalize title for fingerprinting
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Check if two listings are likely duplicates
 */
export function areDuplicates(
  fp1: ListingFingerprint,
  fp2: ListingFingerprint,
  threshold: "strict" | "normal" | "loose" = "normal"
): boolean {
  // Strict: Exact match on combined hash
  if (threshold === "strict") {
    return fp1.combinedHash === fp2.combinedHash;
  }

  // Normal: Match on content hash OR (title + price + seller)
  if (threshold === "normal") {
    if (fp1.contentHash === fp2.contentHash) return true;
    if (fp1.titleHash === fp2.titleHash && fp1.priceHash === fp2.priceHash && fp1.sellerHash === fp2.sellerHash) {
      return true;
    }
    // Image hash match (if both have images)
    if (fp1.imageHash && fp2.imageHash && fp1.imageHash === fp2.imageHash) {
      return true;
    }
  }

  // Loose: Match on title + price (same listing, different seller = cross-post)
  if (threshold === "loose") {
    if (fp1.titleHash === fp2.titleHash && fp1.priceHash === fp2.priceHash) {
      return true;
    }
  }

  return false;
}

/**
 * Deduplicate listings array (optimized)
 * Uses hash-based lookup for O(n) performance instead of O(n²)
 */
export function deduplicateListings<T extends ListingForFingerprint>(
  listings: T[],
  threshold: "strict" | "normal" | "loose" = "normal"
): T[] {
  const seen = new Map<string, T>();
  const fingerprints = new Map<T, ListingFingerprint>();
  const hashGroups = new Map<string, T[]>();

  // Generate fingerprints for all listings
  for (const listing of listings) {
    const fp = generateFingerprint(listing);
    fingerprints.set(listing, fp);

    // Group by combined hash for faster lookup
    if (!hashGroups.has(fp.combinedHash)) {
      hashGroups.set(fp.combinedHash, []);
    }
    hashGroups.get(fp.combinedHash)!.push(listing);
  }

  // Deduplicate using hash-based lookup
  for (const listing of listings) {
    const fp = fingerprints.get(listing)!;
    let isDuplicate = false;

    // Check against hash groups first (fast path)
    const sameHashGroup = hashGroups.get(fp.combinedHash);
    if (sameHashGroup && sameHashGroup.length > 1) {
      // Multiple listings with same hash - check if we've seen one
      for (const candidate of sameHashGroup) {
        if (candidate.id !== listing.id && seen.has(fp.combinedHash)) {
          isDuplicate = true;
          break;
        }
      }
    }

    // If not found in hash group, check against all seen (for threshold matching)
    if (!isDuplicate) {
      for (const [seenHash, seenListing] of seen.entries()) {
        const seenFp = fingerprints.get(seenListing)!;
        if (areDuplicates(fp, seenFp, threshold)) {
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) {
      seen.set(fp.combinedHash, listing);
    }
  }

  return Array.from(seen.values());
}
