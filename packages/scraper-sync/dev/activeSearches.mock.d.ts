/**
 * Mock Active Searches
 * Used in db-lite mode when database is not available
 */
export interface ActiveSearch {
    id: string;
    userId: string;
    marketplace: "facebook" | "vinted";
    query: string;
    isActive: boolean;
    lastRunAt: string | null;
    filters: {
        keywords?: string[];
        minPrice?: number;
        maxPrice?: number;
        maxDistanceMiles?: number;
        condition?: string[];
        location?: string;
    } | null;
}
export declare const ACTIVE_SEARCHES: ActiveSearch[];
//# sourceMappingURL=activeSearches.mock.d.ts.map