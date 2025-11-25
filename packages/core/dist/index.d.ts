export * from './logger';
export * from './env';
export * from './plans';
export type MarketplaceSite = "CRAIGSLIST" | "FB_MARKETPLACE" | "OFFERUP" | "VINTED";
export type Condition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
export interface SearchFilter {
    category: string;
    manufacturer?: string;
    models?: string[];
    minPrice?: number;
    maxPrice?: number;
    radiusMiles?: number;
    locationCity?: string;
    locationLat?: number;
    locationLng?: number;
    conditions?: Condition[];
    sites?: MarketplaceSite[];
}
export interface SavedSearch extends SearchFilter {
    id: string;
    userId: string;
    name: string;
    maxResultsPerRun: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    lastRunAt?: string | null;
}
export interface Listing {
    id: string;
    externalId: string;
    site: MarketplaceSite;
    url: string;
    title: string;
    description?: string;
    price: number;
    currency: string;
    manufacturer?: string;
    model?: string;
    condition?: Condition;
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    postedAt?: string;
    scrapedAt: string;
    imageUrls: string[];
}
export interface ListingMatch {
    id: string;
    savedSearchId: string;
    listingId: string;
    matchedAt: string;
    notified: boolean;
    notifiedAt?: string | null;
}
export interface SearchRunRequest extends SearchFilter {
    page?: number;
    pageSize?: number;
}
export interface SearchRunResponse {
    results: Listing[];
    total: number;
    page: number;
    pageSize: number;
}
export interface CreateSavedSearchRequest {
    name: string;
    category: string;
    manufacturer?: string;
    models?: string[];
    minPrice?: number;
    maxPrice?: number;
    radiusMiles?: number;
    locationCity?: string;
    locationLat?: number;
    locationLng?: number;
    conditions?: Condition[];
    sites?: MarketplaceSite[];
    maxResultsPerRun?: number;
    active?: boolean;
}
export interface UpdateSavedSearchRequest extends Partial<CreateSavedSearchRequest> {
}
export interface ListingsFeedRequest {
    searchId?: string;
    page?: number;
    pageSize?: number;
}
export interface ListingsFeedResponse {
    listings: Listing[];
    total: number;
    page: number;
    pageSize: number;
}
export interface AlertsRecentResponse {
    matches: Array<ListingMatch & {
        listing: Listing;
        savedSearch: SavedSearch;
    }>;
    total: number;
}
export interface User {
    id: string;
    email: string;
    expoPushToken?: string | null;
    createdAt: string;
}
//# sourceMappingURL=index.d.ts.map
