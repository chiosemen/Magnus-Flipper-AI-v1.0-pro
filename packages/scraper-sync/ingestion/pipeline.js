/**
 * Ingestion Pipeline
 * Handles storage of normalized listings in Supabase with deduplication
 */
import { createClient } from "@supabase/supabase-js";
import { ListingNormalizer } from "../normalization/normalizer.js";
export class IngestionPipeline {
    supabase;
    normalizer;
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.normalizer = new ListingNormalizer();
    }
    /**
     * Ingest scraped listings into database
     */
    async ingest(listings) {
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
        for (const listing of normalized) {
            try {
                // Check if listing already exists
                const existing = await this.findExistingListing(listing);
                if (existing) {
                    // Update existing listing
                    await this.updateListing(existing.id, listing);
                    stats.updated++;
                }
                else {
                    // Insert new listing
                    await this.insertListing(listing);
                    stats.inserted++;
                }
            }
            catch (error) {
                console.error(`Error ingesting listing: ${error.message}`);
                stats.errors++;
            }
        }
        return stats;
    }
    /**
     * Find existing listing by content hash or link
     */
    async findExistingListing(listing) {
        // First try to find by link (most reliable)
        const { data: byLink } = await this.supabase
            .from("scraped_listings")
            .select("id, content_hash, first_seen_at, last_seen_at")
            .eq("link", listing.link)
            .single();
        if (byLink) {
            return byLink;
        }
        // Then try by content hash (for deduplication)
        const { data: byHash } = await this.supabase
            .from("scraped_listings")
            .select("id, content_hash, first_seen_at, last_seen_at")
            .eq("content_hash", listing.content_hash)
            .eq("marketplace", listing.marketplace)
            .single();
        return byHash || null;
    }
    /**
     * Insert new listing
     */
    async insertListing(listing) {
        const { error } = await this.supabase
            .from("scraped_listings")
            .insert({
            // Core fields
            title: listing.title,
            normalized_title: listing.normalized_title,
            price: listing.price,
            normalized_price: listing.normalized_price,
            currency: listing.currency,
            link: listing.link,
            images: listing.images,
            // Seller info
            seller_id: listing.seller_id,
            seller_name: listing.seller_name,
            seller_rating: listing.seller_rating,
            seller_reviews_count: listing.seller_reviews_count,
            // Metadata
            marketplace: listing.marketplace,
            category: listing.category,
            condition: listing.condition,
            normalized_condition: listing.normalized_condition,
            location: listing.location,
            description: listing.description,
            // Shipping
            shipping_available: listing.shipping_available,
            shipping_cost: listing.shipping_cost,
            // Engagement
            views_count: listing.views_count,
            // Deduplication
            content_hash: listing.content_hash,
            duplicate_group_id: listing.duplicate_group_id,
            // Freshness
            freshness_score: listing.freshness_score,
            first_seen_at: listing.first_seen_at,
            last_seen_at: listing.last_seen_at,
            // Anomaly detection
            is_anomaly: listing.is_anomaly,
            anomaly_reason: listing.anomaly_reason,
            anomaly_score: listing.anomaly_score,
            // Raw data
            raw_data: listing.raw_data,
            // Timestamps
            timestamp: listing.timestamp,
            created_at: new Date().toISOString(),
        });
        if (error) {
            throw new Error(`Insert error: ${error.message}`);
        }
    }
    /**
     * Update existing listing (update freshness, last_seen_at, price if changed)
     */
    async updateListing(id, listing) {
        const updates = {
            last_seen_at: new Date().toISOString(),
            freshness_score: listing.freshness_score,
        };
        // Update price if it changed
        updates.price = listing.price;
        updates.normalized_price = listing.normalized_price;
        // Update images if they changed
        if (listing.images && listing.images.length > 0) {
            updates.images = listing.images;
        }
        const { error } = await this.supabase
            .from("scraped_listings")
            .update(updates)
            .eq("id", id);
        if (error) {
            throw new Error(`Update error: ${error.message}`);
        }
    }
    /**
     * Mark stale listings (not seen in recent scrapes)
     */
    async markStaleListings(marketplace, hoursOld = 48) {
        const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
        const { data, error } = await this.supabase
            .from("scraped_listings")
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
    async getDuplicateGroups() {
        const { data, error } = await this.supabase
            .from("scraped_listings")
            .select("duplicate_group_id, marketplace, title, price, link")
            .not("duplicate_group_id", "is", null)
            .order("duplicate_group_id");
        if (error) {
            console.error(`Error fetching duplicates: ${error.message}`);
            return [];
        }
        // Group by duplicate_group_id
        const groups = new Map();
        for (const item of data || []) {
            const groupId = item.duplicate_group_id;
            if (!groups.has(groupId)) {
                groups.set(groupId, []);
            }
            groups.get(groupId).push(item);
        }
        return Array.from(groups.values()).filter((group) => group.length > 1);
    }
    /**
     * Get anomalous listings for review
     */
    async getAnomalousListings(limit = 100) {
        const { data, error } = await this.supabase
            .from("scraped_listings")
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
    async getFreshListings(marketplace, minFreshness = 70, limit = 100) {
        let query = this.supabase
            .from("scraped_listings")
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
    async cleanupOldListings(daysOld = 30) {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await this.supabase
            .from("scraped_listings")
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
//# sourceMappingURL=pipeline.js.map