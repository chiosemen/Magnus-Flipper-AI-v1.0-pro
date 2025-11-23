import type { SavedSearch, Listing, ListingMatch } from '@magnus-flipper-ai/core'
import { fetchClient } from './fetchClient'

export interface AlertsStats {
  unread: number
  lastNotifiedAt?: string | null
  totalMatches: number
}

export interface ListingsFeedResponse {
  listings: Listing[]
  total: number
  page: number
  pageSize: number
}

export interface SavedSearchPayload extends Partial<SavedSearch> {}

export const api = {
  getSavedSearches: (signal?: AbortSignal) =>
    fetchClient<SavedSearch[]>('/api/saved-searches', { signal }),
  createSavedSearch: (payload: SavedSearchPayload, signal?: AbortSignal) =>
    fetchClient<SavedSearch>('/api/saved-searches', { method: 'POST', body: JSON.stringify(payload), signal }),
  updateSavedSearch: (id: string, payload: SavedSearchPayload, signal?: AbortSignal) =>
    fetchClient<SavedSearch>(`/api/saved-searches/${id}`, { method: 'PATCH', body: JSON.stringify(payload), signal }),
  deleteSavedSearch: (id: string, signal?: AbortSignal) =>
    fetchClient<void>(`/api/saved-searches/${id}`, { method: 'DELETE', signal }),
  getListingsFeed: (params: Record<string, string | number | undefined>, signal?: AbortSignal) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v != null && query.append(k, String(v)))
    return fetchClient<ListingsFeedResponse>(`/api/listings/feed?${query.toString()}`, { signal })
  },
  getListing: (id: string, signal?: AbortSignal) => fetchClient<Listing>(`/api/listings/${id}`, { signal }),
  getAlertsRecent: (signal?: AbortSignal) =>
    fetchClient<Array<ListingMatch & { listing: Listing; savedSearch: SavedSearch }>>('/api/alerts/recent', {
      signal,
    }),
  getAlertsStats: (signal?: AbortSignal) => fetchClient<AlertsStats>('/api/alerts/stats', { signal }),
}
