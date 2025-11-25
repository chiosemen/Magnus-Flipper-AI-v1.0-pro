import type {
  SavedSearch,
  Listing,
  ListingMatch,
  SearchFilter,
  SubscriptionPlan,
} from '@magnus-flipper-ai/core'

export interface PlanUsage {
  plan: SubscriptionPlan
  usage: {
    savedSearches: number
    alertsThisMonth: number
    scansThisMonth: number
  }
  limits: {
    savedSearches: number
    alertsPerMonth: number
    scansPerMonth: number
  }
}

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

export interface SavedSearchPayload extends Partial<SearchFilter> {
  name?: string
  maxResultsPerRun?: number
  active?: boolean
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

function getAuthHeader() {
  if (typeof window === 'undefined') return {}
  // Supabase stores the access token in localStorage; fall back to a generic key for SSR safety.
  const token =
    localStorage.getItem('supabase.auth.token') ||
    localStorage.getItem('sb-access-token') ||
    localStorage.getItem('authToken')

  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || `Request failed: ${res.status}`)
  }

  return res.json()
}

export function getSavedSearches() {
  return authedFetch<SavedSearch[]>('/api/saved-searches')
}

export function createSavedSearch(payload: SavedSearchPayload) {
  return authedFetch<SavedSearch>('/api/saved-searches', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSavedSearch(id: string, payload: SavedSearchPayload) {
  return authedFetch<SavedSearch>(`/api/saved-searches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteSavedSearch(id: string) {
  return authedFetch<void>(`/api/saved-searches/${id}`, { method: 'DELETE' })
}

export function getListingsFeed(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) query.append(key, String(value))
  })
  return authedFetch<ListingsFeedResponse>(`/api/listings/feed?${query.toString()}`)
}

export function getListing(id: string) {
  return authedFetch<Listing>(`/api/listings/${id}`)
}

export function getAlertsRecent() {
  return authedFetch<Array<ListingMatch & { listing: Listing; savedSearch: SavedSearch }>>(
    '/api/alerts/recent'
  )
}

export function getAlertsStats() {
  return authedFetch<AlertsStats>('/api/alerts/stats')
}

export function getPlan() {
  return authedFetch<PlanUsage>('/api/plan')
}
