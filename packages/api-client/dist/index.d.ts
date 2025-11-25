import { z } from 'zod';

declare const SavedSearchSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    category: z.ZodString;
    manufacturer: z.ZodString;
    models: z.ZodArray<z.ZodString, "many">;
    minPrice: z.ZodNumber;
    maxPrice: z.ZodNumber;
    radiusMiles: z.ZodNumber;
    location: z.ZodString;
    active: z.ZodBoolean;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    user_id: string;
    category: string;
    manufacturer: string;
    models: string[];
    minPrice: number;
    maxPrice: number;
    radiusMiles: number;
    location: string;
    active: boolean;
    createdAt?: string | undefined;
}, {
    id: string;
    user_id: string;
    category: string;
    manufacturer: string;
    models: string[];
    minPrice: number;
    maxPrice: number;
    radiusMiles: number;
    location: string;
    active: boolean;
    createdAt?: string | undefined;
}>;
declare const ListingSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    price: z.ZodNumber;
    image: z.ZodString;
    source: z.ZodEnum<["facebook", "craigslist", "offerup", "gumtree", "ebay"]>;
    location: z.ZodString;
    postedAt: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    location: string;
    title: string;
    price: number;
    image: string;
    source: "facebook" | "craigslist" | "offerup" | "gumtree" | "ebay";
    postedAt: string;
    url?: string | undefined;
}, {
    id: string;
    location: string;
    title: string;
    price: number;
    image: string;
    source: "facebook" | "craigslist" | "offerup" | "gumtree" | "ebay";
    postedAt: string;
    url?: string | undefined;
}>;
declare const AlertRecordSchema: z.ZodObject<{
    id: z.ZodString;
    saved_search_id: z.ZodString;
    listing_id: z.ZodString;
    matchedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    saved_search_id: string;
    listing_id: string;
    matchedAt: string;
}, {
    id: string;
    saved_search_id: string;
    listing_id: string;
    matchedAt: string;
}>;
declare const BillingStatusSchema: z.ZodObject<{
    plan: z.ZodOptional<z.ZodEnum<["STARTER", "BASIC", "PREMIUM", "ULTRA", "TRIAL"]>>;
    status: z.ZodOptional<z.ZodString>;
    trial_expires_at: z.ZodOptional<z.ZodString>;
    subscription_current_period_end: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    plan?: "STARTER" | "BASIC" | "PREMIUM" | "ULTRA" | "TRIAL" | undefined;
    trial_expires_at?: string | undefined;
    subscription_current_period_end?: string | undefined;
}, {
    status?: string | undefined;
    plan?: "STARTER" | "BASIC" | "PREMIUM" | "ULTRA" | "TRIAL" | undefined;
    trial_expires_at?: string | undefined;
    subscription_current_period_end?: string | undefined;
}>;
declare const AlertsStatsSchema: z.ZodObject<{
    totalAlerts: z.ZodNumber;
    lastMatch: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    totalAlerts: number;
    lastMatch?: string | undefined;
}, {
    totalAlerts: number;
    lastMatch?: string | undefined;
}>;
declare const SavedSearchArraySchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    category: z.ZodString;
    manufacturer: z.ZodString;
    models: z.ZodArray<z.ZodString, "many">;
    minPrice: z.ZodNumber;
    maxPrice: z.ZodNumber;
    radiusMiles: z.ZodNumber;
    location: z.ZodString;
    active: z.ZodBoolean;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    user_id: string;
    category: string;
    manufacturer: string;
    models: string[];
    minPrice: number;
    maxPrice: number;
    radiusMiles: number;
    location: string;
    active: boolean;
    createdAt?: string | undefined;
}, {
    id: string;
    user_id: string;
    category: string;
    manufacturer: string;
    models: string[];
    minPrice: number;
    maxPrice: number;
    radiusMiles: number;
    location: string;
    active: boolean;
    createdAt?: string | undefined;
}>, "many">;
declare const ListingArraySchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    price: z.ZodNumber;
    image: z.ZodString;
    source: z.ZodEnum<["facebook", "craigslist", "offerup", "gumtree", "ebay"]>;
    location: z.ZodString;
    postedAt: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    location: string;
    title: string;
    price: number;
    image: string;
    source: "facebook" | "craigslist" | "offerup" | "gumtree" | "ebay";
    postedAt: string;
    url?: string | undefined;
}, {
    id: string;
    location: string;
    title: string;
    price: number;
    image: string;
    source: "facebook" | "craigslist" | "offerup" | "gumtree" | "ebay";
    postedAt: string;
    url?: string | undefined;
}>, "many">;
declare const AlertRecordArraySchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    saved_search_id: z.ZodString;
    listing_id: z.ZodString;
    matchedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    saved_search_id: string;
    listing_id: string;
    matchedAt: string;
}, {
    id: string;
    saved_search_id: string;
    listing_id: string;
    matchedAt: string;
}>, "many">;

type SavedSearch = z.infer<typeof SavedSearchSchema>;
type Listing = z.infer<typeof ListingSchema>;
type AlertRecord = z.infer<typeof AlertRecordSchema>;
type BillingStatus = z.infer<typeof BillingStatusSchema>;
type AlertsStats = z.infer<typeof AlertsStatsSchema>;
type ListingSource = Listing["source"];
type BillingPlan = BillingStatus["plan"];
type SavedSearchCreateRequest = SavedSearch;
type SavedSearchUpdateRequest = Partial<SavedSearch>;
interface ListingsFeedParams {
    page?: number;
    limit?: number;
}
type SavedSearchListResponse = SavedSearch[];
type SavedSearchResponse = SavedSearch;
type ListingsFeedResponse = Listing[];
type ListingResponse = Listing;
type AlertsRecentResponse = AlertRecord[];
type AlertsStatsResponse = AlertsStats;
type BillingStatusResponse = BillingStatus;
type HealthResponse = unknown;

interface FetchClientConfig {
    baseUrl?: string;
    getToken?: () => string | null | Promise<string | null>;
    defaultHeaders?: HeadersInit;
    retries?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
    retryOn?: (response: Response | undefined, error: unknown, attempt: number) => boolean | Promise<boolean>;
}
interface FetchRequestInit extends RequestInit {
    skipAuth?: boolean;
}
type FetchClient = <T = unknown>(path: string, init?: FetchRequestInit) => Promise<T>;
declare class ApiError extends Error {
    readonly status?: number;
    readonly body?: unknown;
    constructor(message: string, status?: number, body?: unknown);
}
declare function createFetchClient(config?: FetchClientConfig): FetchClient;

declare function createSavedSearchesApi(fetcher: FetchClient): {
    list: (signal?: AbortSignal) => Promise<SavedSearchListResponse>;
    create: (payload: SavedSearchCreateRequest, signal?: AbortSignal) => Promise<SavedSearch>;
    getById: (id: string, signal?: AbortSignal) => Promise<SavedSearch>;
    update: (id: string, payload: SavedSearchUpdateRequest, signal?: AbortSignal) => Promise<SavedSearch>;
    remove: (id: string, signal?: AbortSignal) => Promise<void>;
};
type SavedSearchesApi = ReturnType<typeof createSavedSearchesApi>;

declare function createListingsApi(fetcher: FetchClient): {
    feed: (params?: ListingsFeedParams, signal?: AbortSignal) => Promise<Listing[]>;
    getById: (id: string, signal?: AbortSignal) => Promise<Listing>;
};
type ListingsApi = ReturnType<typeof createListingsApi>;

declare function createAlertsApi(fetcher: FetchClient): {
    recent: (signal?: AbortSignal) => Promise<AlertRecord[]>;
    stats: (signal?: AbortSignal) => Promise<AlertsStats>;
};
type AlertsApi = ReturnType<typeof createAlertsApi>;

declare function createApiClient(config?: FetchClientConfig): {
    fetch: FetchClient;
    savedSearches: {
        list: (signal?: AbortSignal) => Promise<SavedSearchListResponse>;
        create: (payload: SavedSearchCreateRequest, signal?: AbortSignal) => Promise<SavedSearch>;
        getById: (id: string, signal?: AbortSignal) => Promise<SavedSearch>;
        update: (id: string, payload: SavedSearchUpdateRequest, signal?: AbortSignal) => Promise<SavedSearch>;
        remove: (id: string, signal?: AbortSignal) => Promise<void>;
    };
    listings: {
        feed: (params?: ListingsFeedParams, signal?: AbortSignal) => Promise<Listing[]>;
        getById: (id: string, signal?: AbortSignal) => Promise<Listing>;
    };
    alerts: {
        recent: (signal?: AbortSignal) => Promise<AlertRecord[]>;
        stats: (signal?: AbortSignal) => Promise<AlertsStats>;
    };
    billing: {
        status: (signal?: AbortSignal) => Promise<BillingStatus>;
    };
    health: (signal?: AbortSignal) => Promise<unknown>;
};
type ApiClient = ReturnType<typeof createApiClient>;
declare const apiClient: {
    fetch: FetchClient;
    savedSearches: {
        list: (signal?: AbortSignal) => Promise<SavedSearchListResponse>;
        create: (payload: SavedSearchCreateRequest, signal?: AbortSignal) => Promise<SavedSearch>;
        getById: (id: string, signal?: AbortSignal) => Promise<SavedSearch>;
        update: (id: string, payload: SavedSearchUpdateRequest, signal?: AbortSignal) => Promise<SavedSearch>;
        remove: (id: string, signal?: AbortSignal) => Promise<void>;
    };
    listings: {
        feed: (params?: ListingsFeedParams, signal?: AbortSignal) => Promise<Listing[]>;
        getById: (id: string, signal?: AbortSignal) => Promise<Listing>;
    };
    alerts: {
        recent: (signal?: AbortSignal) => Promise<AlertRecord[]>;
        stats: (signal?: AbortSignal) => Promise<AlertsStats>;
    };
    billing: {
        status: (signal?: AbortSignal) => Promise<BillingStatus>;
    };
    health: (signal?: AbortSignal) => Promise<unknown>;
};

export { type AlertRecord, AlertRecordArraySchema, AlertRecordSchema, type AlertsApi, type AlertsRecentResponse, type AlertsStats, type AlertsStatsResponse, AlertsStatsSchema, type ApiClient, ApiError, type BillingPlan, type BillingStatus, type BillingStatusResponse, BillingStatusSchema, type FetchClient, type FetchClientConfig, type FetchRequestInit, type HealthResponse, type Listing, ListingArraySchema, type ListingResponse, ListingSchema, type ListingSource, type ListingsApi, type ListingsFeedParams, type ListingsFeedResponse, type SavedSearch, SavedSearchArraySchema, type SavedSearchCreateRequest, type SavedSearchListResponse, type SavedSearchResponse, SavedSearchSchema, type SavedSearchUpdateRequest, type SavedSearchesApi, apiClient, createAlertsApi, createApiClient, createFetchClient, createListingsApi, createSavedSearchesApi };
