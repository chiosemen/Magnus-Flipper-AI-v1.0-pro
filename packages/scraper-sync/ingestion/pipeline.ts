/**
 * Ingestion Pipeline
 * Handles storage of normalized listings in Supabase with deduplication
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ListingNormalizer } from "../normalization/normalizer.js";
import type {
  ScrapedListing,
} from "../types/ScrapedListing.js";

export class IngestionPipeline {
  private supabase: SupabaseClient;
  private normalizer: ListingNormalizer;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
    this.normalizer = new ListingNormalizer();
  }

  /**
   * Ingest scraped listings into database
   */
  async ingest(listings: ScrapedListing[]): Promise<{
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
  }> {
    const stats = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    // Normalize listings
    const normalized = this.normalizer.normalizeAll(listings);

    // Detect anomalies
    this.normalizer.detectAnomalies(normalized);

    // Detect duplicates within this batch
    const duplicateMap = this.normalizer.detectDuplicates(normalized);

    // Apply duplicate group IDs
    for (const listing of normalized) {
      const groupId = duplicateMap.get(listing.link);
      if (groupId) {
        listing.duplicate_group_id = groupId;
      }
    }

    // Process each listing
    try {
      const { error } = await this.supabase
        .from("marketplace_listings")
        .upsert(normalized, {
          onConflict: "content_hash",
        });

      if (error) {
        throw error;
      }

      stats.inserted = normalized.length;
    } catch (error: any) {
      console.error(`Error upserting listings: ${error.message}`);
      stats.errors = normalized.length;
    }

    return stats;
  }

  /**
   * Mark stale listings (not seen in recent scrapes)
   */
  async markStaleListings(marketplace: string, hoursOld: number = 48): Promise<number> {
    const cutoffTime = new Date(
      Date.now() - hoursOld * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await this.supabase
      .from("marketplace_listings")
      .update({
        freshness_score: 0,
        is_stale: true,
      })
      .eq("marketplace", marketplace)
      .lt("last_seen_at", cutoffTime)
      .select("id");

    if (error) {
      console.error(`Error marking stale listings: ${error.message}`);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Get duplicate groups for review
   */
  async getDuplicateGroups(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("marketplace_listings")
      .select("duplicate_group_id, marketplace, title, price, link")
      .not("duplicate_group_id", "is", null)
      .order("duplicate_group_id");

    if (error) {
      console.error(`Error fetching duplicates: ${error.message}`);
      return [];
    }

    // Group by duplicate_group_id
    const groups = new Map<string, any[]>();
    for (const item of data || []) {
      const groupId = item.duplicate_group_id;
      if (!groups.has(groupId)) {
        groups.set(groupId, []);
      }
      groups.get(groupId)!.push(item);
    }

    return Array.from(groups.values()).filter((group) => group.length > 1);
  }

  /**
   * Get anomalous listings for review
   */
  async getAnomalousListings(limit: number = 100): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("marketplace_listings")
      .select("*")
      .eq("is_anomaly", true)
      .order("anomaly_score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Error fetching anomalies: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Get listings with high freshness scores
   */
  async getFreshListings(
    marketplace?: string,
    minFreshness: number = 70,
    limit: number = 100
  ): Promise<any[]> {
    let query = this.supabase
      .from("marketplace_listings")
      .select("*")
      .gte("freshness_score", minFreshness)
      .order("freshness_score", { ascending: false })
      .limit(limit);

    if (marketplace) {
      query = query.eq("marketplace", marketplace);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching fresh listings: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Delete old listings
   */
  async cleanupOldListings(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - daysOld * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await this.supabase
      .from("marketplace_listings")
      .delete()
      .lt("last_seen_at", cutoffDate)
      .select("id");

    if (error) {
      console.error(`Error cleaning up old listings: ${error.message}`);
      return 0;
    }

    return data?.length || 0;
  }
}
