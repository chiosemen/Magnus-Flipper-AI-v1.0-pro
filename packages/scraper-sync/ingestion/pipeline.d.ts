/**
 * Ingestion Pipeline
 * Handles storage of normalized listings in Supabase with deduplication
 */
import type { ScrapedListing } from "../types/ScrapedListing.js";
export declare class IngestionPipeline {
    private supabase;
    private normalizer;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Ingest scraped listings into database
     */
    ingest(listings: ScrapedListing[]): Promise<{
        inserted: number;
        updated: number;
        skipped: number;
        errors: number;
    }>;
    /**
     * Find existing listing by content hash or link
     */
    private findExistingListing;
    /**
     * Insert new listing
     */
    private insertListing;
    /**
     * Update existing listing (update freshness, last_seen_at, price if changed)
     */
    private updateListing;
    /**
     * Mark stale listings (not seen in recent scrapes)
     */
    markStaleListings(marketplace: string, hoursOld?: number): Promise<number>;
    /**
     * Get duplicate groups for review
     */
    getDuplicateGroups(): Promise<any[]>;
    /**
     * Get anomalous listings for review
     */
    getAnomalousListings(limit?: number): Promise<any[]>;
    /**
     * Get listings with high freshness scores
     */
    getFreshListings(marketplace?: string, minFreshness?: number, limit?: number): Promise<any[]>;
    /**
     * Delete old listings
     */
    cleanupOldListings(daysOld?: number): Promise<number>;
}
//# sourceMappingURL=pipeline.d.ts.map