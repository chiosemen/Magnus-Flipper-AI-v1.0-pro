import type { Listing, ListingMatch, MarketplaceSite, SavedSearch } from '@magnus-flipper-ai/core';
import {
  createApiClient,
  type AlertRecord,
  type AlertsStats as ApiAlertsStats,
  type Listing as ApiListing,
  type ListingsFeedParams,
  type SavedSearch as ApiSavedSearch,
} from '@magnus-flipper-ai/api-client';
import { getAuthToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const client = createApiClient({
  baseUrl: API_BASE,
  getToken: async () => getAuthToken(),
});

export const apiClient = client;

export interface AlertsStats {
  unread: number;
  lastNotifiedAt?: string | null;
  totalMatches: number;
}

export interface ListingsFeedResponse {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SavedSearchPayload extends Partial<SavedSearch> {}

const SOURCE_MAP: Record<ApiListing['source'], MarketplaceSite> = {
  facebook: 'FB_MARKETPLACE',
  craigslist: 'CRAIGSLIST',
  offerup: 'OFFERUP',
  gumtree: 'CRAIGSLIST',
  ebay: 'CRAIGSLIST',
};

function mapSourceToSite(source?: ApiListing['source']): MarketplaceSite {
  if (source && SOURCE_MAP[source]) return SOURCE_MAP[source];
  return 'CRAIGSLIST';
}

function mapListing(api: ApiListing): Listing {
  const postedAt = api.postedAt ?? new Date().toISOString();
  return {
    id: api.id,
    externalId: api.id,
    site: mapSourceToSite(api.source),
    url: api.url || '',
    title: api.title,
    description: undefined,
    price: api.price,
    currency: 'USD',
    manufacturer: undefined,
    model: undefined,
    condition: undefined,
    city: api.location,
    region: undefined,
    country: undefined,
    latitude: undefined,
    longitude: undefined,
    postedAt: api.postedAt,
    scrapedAt: postedAt,
    imageUrls: api.image ? [api.image] : [],
  };
}

function mapSavedSearch(api: ApiSavedSearch): SavedSearch {
  const createdAt = api.createdAt ?? new Date().toISOString();
  return {
    id: api.id,
    userId: api.user_id,
    name: api.category,
    category: api.category,
    manufacturer: api.manufacturer,
    models: api.models,
    minPrice: api.minPrice,
    maxPrice: api.maxPrice,
    radiusMiles: api.radiusMiles,
    locationCity: api.location,
    locationLat: undefined,
    locationLng: undefined,
    conditions: undefined,
    sites: undefined,
    active: api.active,
    maxResultsPerRun: 0,
    createdAt,
    updatedAt: createdAt,
    lastRunAt: null,
  };
}

async function hydrateAlert(
  record: AlertRecord
): Promise<ListingMatch & { listing?: Listing; savedSearch?: SavedSearch }> {
  const match: ListingMatch = {
    id: record.id,
    savedSearchId: record.saved_search_id,
    listingId: record.listing_id,
    matchedAt: record.matchedAt,
    notified: false,
    notifiedAt: null,
  };

  const [listingResult, savedSearchResult] = await Promise.allSettled([
    client.listings.getById(record.listing_id),
    client.savedSearches.getById(record.saved_search_id),
  ]);

  const listing = listingResult.status === 'fulfilled' ? mapListing(listingResult.value) : undefined;
  const savedSearch = savedSearchResult.status === 'fulfilled' ? mapSavedSearch(savedSearchResult.value) : undefined;

  return { ...match, listing, savedSearch };
}

function mapAlertsStats(stats: ApiAlertsStats): AlertsStats {
  return {
    unread: stats.totalAlerts ?? 0,
    totalMatches: stats.totalAlerts ?? 0,
    lastNotifiedAt: stats.lastMatch ?? null,
  };
}

export async function getSavedSearches(signal?: AbortSignal) {
  const data = await client.savedSearches.list(signal);
  return data.map(mapSavedSearch);
}

export async function createSavedSearch(payload: SavedSearchPayload, signal?: AbortSignal) {
  const created = await client.savedSearches.create(payload as ApiSavedSearch, signal);
  return mapSavedSearch(created);
}

export async function updateSavedSearch(id: string, payload: SavedSearchPayload, signal?: AbortSignal) {
  const updated = await client.savedSearches.update(id, payload as ApiSavedSearch, signal);
  return mapSavedSearch(updated);
}

export async function deleteSavedSearch(id: string, signal?: AbortSignal) {
  return client.savedSearches.remove(id, signal);
}

export async function getListingsFeed(
  params: Record<string, string | number | undefined> = {},
  signal?: AbortSignal
): Promise<ListingsFeedResponse> {
  const page = params.page !== undefined ? Number(params.page) : undefined;
  const limit = (params.pageSize ?? params.limit) !== undefined ? Number(params.pageSize ?? params.limit) : undefined;

  const feedParams: ListingsFeedParams = {
    page,
    limit,
  };

  const data = await client.listings.feed(feedParams, signal);
  const listings = data.map(mapListing);
  const size = (limit ?? listings.length) || 0;
  return {
    listings,
    total: listings.length,
    page: page ?? 1,
    pageSize: size,
  };
}

export async function getListing(id: string, signal?: AbortSignal) {
  const data = await client.listings.getById(id, signal);
  return mapListing(data);
}

export async function getAlertsRecent(signal?: AbortSignal) {
  const data = await client.alerts.recent(signal);
  return Promise.all(data.map(hydrateAlert));
}

export async function getAlertsStats(signal?: AbortSignal) {
  const stats = await client.alerts.stats(signal);
  return mapAlertsStats(stats);
}

export const api = {
  getSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getListingsFeed,
  getListing,
  getAlertsRecent,
  getAlertsStats,
};
