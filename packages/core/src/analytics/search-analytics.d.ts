/**
 * Search Analytics Service
 * Tracks and reports performance metrics for saved searches
 */
export interface SearchRunMetrics {
    searchId: string;
    listingsScanned: number;
    matchesFound: number;
    runTimestamp: Date;
}
export interface SearchStats {
    searchId: string;
    searchName: string;
    marketplace: string;
    totalListingsScanned: number;
    totalMatchesFound: number;
    totalRuns: number;
    lastRunAt: Date | null;
    avgMatchesPerDay: number;
    avgMatchesPerRun: number;
    createdAt: Date;
    daysSinceCreation: number;
}
/**
 * Update search metrics after a worker run
 */
export declare function recordSearchRun(metrics: SearchRunMetrics): Promise<void>;
/**
 * Get comprehensive stats for a single search
 */
export declare function getSearchStats(searchId: string): Promise<SearchStats | null>;
/**
 * Get stats for all user's searches
 */
export declare function getUserSearchStats(userId: string): Promise<SearchStats[]>;
/**
 * Get activity timeline for a search (recent matches)
 */
export declare function getSearchActivityTimeline(searchId: string, limit?: number): Promise<Array<{
    date: Date;
    title: string;
    price: number;
    marketplace: string;
    url: string;
    imageUrl?: string;
}>>;
/**
 * Get aggregated stats for all of user's searches
 */
export declare function getUserAggregatedStats(userId: string): Promise<{
    totalSearches: number;
    activeSearches: number;
    totalMatches: number;
    totalListingsScanned: number;
    avgMatchesPerDay: number;
}>;
//# sourceMappingURL=search-analytics.d.ts.map