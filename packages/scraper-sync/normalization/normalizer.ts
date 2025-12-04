/**
 * Normalization Engine
 * Cleans and standardizes scraped listings into unified schema
 */

import crypto from "crypto";
import type {
  ScrapedListing,
  NormalizedListing,
} from "../types/ScrapedListing.js";

export class ListingNormalizer {
  /**
   * Normalize a single listing
   */
  normalize(listing: ScrapedListing): NormalizedListing {
    return {
      ...listing,
      normalized_title: this.normalizeTitle(listing.title),
      normalized_price: this.normalizePrice(listing.price, listing.currency),
      normalized_condition: this.normalizeCondition(listing.condition),
      content_hash: this.generateContentHash(listing),
      freshness_score: this.calculateFreshnessScore(listing.timestamp),
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_anomaly: false,
    };
  }

  /**
   * Normalize title: lowercase, remove special chars, trim whitespace
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Normalize price to USD
   */
  private normalizePrice(price: number, currency: string): number {
    const conversionRates: Record<string, number> = {
      USD: 1.0,
      EUR: 1.08,
      GBP: 1.27,
      CAD: 0.72,
      AUD: 0.65,
    };

    const rate = conversionRates[currency.toUpperCase()] || 1.0;
    return Math.round(price * rate * 100) / 100;
  }

  /**
   * Normalize condition string
   */
  private normalizeCondition(condition: string): string {
    const conditionMap: Record<string, string> = {
      new: "new",
      like_new: "like new",
      "like new": "like new",
      excellent: "excellent",
      good: "good",
      fair: "fair",
      poor: "poor",
      unknown: "used",
    };

    return conditionMap[condition.toLowerCase()] || "used";
  }

  /**
   * Generate content hash for deduplication
   * Based on title, price, and marketplace
   */
  private generateContentHash(listing: ScrapedListing): string {
    const normalizedTitle = this.normalizeTitle(listing.title);
    const priceRounded = Math.round(listing.price);

    // Create hash from key fields
    const content = `${normalizedTitle}|${priceRounded}|${listing.marketplace}`;

    return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
  }

  /**
   * Calculate freshness score (0-100)
   * Recently posted listings get higher scores
   */
  private calculateFreshnessScore(timestamp: string): number {
    const now = Date.now();
    const posted = new Date(timestamp).getTime();
    const ageInHours = (now - posted) / (1000 * 60 * 60);

    // Exponential decay: 100 at 0 hours, ~50 at 24 hours, ~0 at 168 hours (1 week)
    const score = 100 * Math.exp(-ageInHours / 48);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Batch normalize listings
   */
  normalizeAll(listings: ScrapedListing[]): NormalizedListing[] {
    return listings.map((listing) => this.normalize(listing));
  }

  /**
   * Detect duplicate listings
   * Returns map of content_hash -> duplicate_group_id
   */
  detectDuplicates(
    listings: NormalizedListing[]
  ): Map<string, string> {
    const hashGroups = new Map<string, NormalizedListing[]>();
    const duplicateMap = new Map<string, string>();

    // Group by content hash
    for (const listing of listings) {
      const hash = listing.content_hash;
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash)!.push(listing);
    }

    // Assign duplicate group IDs
    for (const [hash, group] of hashGroups.entries()) {
      if (group.length > 1) {
        const groupId = `dup_${hash}`;
        for (const listing of group) {
          duplicateMap.set(listing.link, groupId);
        }
      }
    }

    return duplicateMap;
  }

  /**
   * Detect anomalies (unusually low prices, suspicious patterns)
   */
  detectAnomalies(listings: NormalizedListing[]): void {
    // Calculate price statistics by category/marketplace
    const priceStats = this.calculatePriceStatistics(listings);

    for (const listing of listings) {
      const key = `${listing.marketplace}_${listing.category || "unknown"}`;
      const stats = priceStats.get(key);

      if (stats) {
        // Detect if price is significantly below average
        const zScore = (listing.normalized_price - stats.mean) / (stats.stdDev || 1);

        if (zScore < -2.5) {
          // Price is 2.5 standard deviations below mean
          listing.is_anomaly = true;
          listing.anomaly_reason = "Unusually low price";
          listing.anomaly_score = Math.abs(zScore);
        }

        // Detect suspiciously round numbers
        if (
          listing.price > 0 &&
          listing.price % 100 === 0 &&
          listing.price < 1000
        ) {
          listing.is_anomaly = true;
          listing.anomaly_reason =
            (listing.anomaly_reason || "") + " Suspicious round price";
        }
      }

      // Detect missing images
      if (!listing.images || listing.images.length === 0) {
        listing.is_anomaly = true;
        listing.anomaly_reason =
          (listing.anomaly_reason || "") + " No images";
      }
    }
  }

  /**
   * Calculate price statistics for anomaly detection
   */
  private calculatePriceStatistics(
    listings: NormalizedListing[]
  ): Map<string, { mean: number; stdDev: number }> {
    const groups = new Map<string, number[]>();

    // Group prices by marketplace + category
    for (const listing of listings) {
      const key = `${listing.marketplace}_${listing.category || "unknown"}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(listing.normalized_price);
    }

    // Calculate statistics
    const stats = new Map<string, { mean: number; stdDev: number }>();

    for (const [key, prices] of groups.entries()) {
      if (prices.length < 3) continue; // Need at least 3 data points

      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance =
        prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
        prices.length;
      const stdDev = Math.sqrt(variance);

      stats.set(key, { mean, stdDev });
    }

    return stats;
  }
}
