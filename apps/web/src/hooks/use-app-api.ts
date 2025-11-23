'use client'

import useSWR, { mutate as globalMutate } from 'swr'
import type { SavedSearch, Listing, ListingMatch } from '@magnus-flipper-ai/core'
import type { ListingsFeedResponse, AlertsStats, SavedSearchPayload } from '@/lib/app-api'
import {
  getSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getListingsFeed,
  getListing,
  getAlertsRecent,
  getAlertsStats,
} from '@/lib/app-api'

const fetcher = (fn: () => Promise<any>) => fn()

export function useSavedSearches() {
  const { data, error, isLoading, mutate } = useSWR<SavedSearch[]>(
    'saved-searches',
    () => fetcher(getSavedSearches),
    { revalidateOnFocus: false }
  )

  return {
    searches: data || [],
    isLoading,
    error,
    async create(payload: SavedSearchPayload) {
      const created = await createSavedSearch(payload)
      mutate()
      return created
    },
    async update(id: string, payload: SavedSearchPayload) {
      const updated = await updateSavedSearch(id, payload)
      mutate()
      return updated
    },
    async remove(id: string) {
      await deleteSavedSearch(id)
      mutate()
    },
  }
}

export function useListingsFeed(params: Record<string, string | number | undefined>) {
  const key = ['listings-feed', params]
  const { data, error, isLoading, isValidating, mutate } = useSWR<ListingsFeedResponse>(
    key,
    () => fetcher(() => getListingsFeed(params)),
    { revalidateOnFocus: false }
  )

  return { feed: data, isLoading, isValidating, error, refresh: mutate }
}

export function useListing(id?: string) {
  const { data, error, isLoading } = useSWR<Listing>(
    id ? ['listing', id] : null,
    () => fetcher(() => getListing(id!)),
    { revalidateOnFocus: false }
  )
  return { listing: data, error, isLoading }
}

export function useAlerts() {
  const { data, error, isLoading, mutate } = useSWR<
    Array<ListingMatch & { listing: Listing }>
  >('alerts-recent', () => fetcher(getAlertsRecent), { revalidateOnFocus: false })

  const stats = useSWR<AlertsStats>('alerts-stats', () => fetcher(getAlertsStats), {
    revalidateOnFocus: false,
  })

  return {
    alerts: data || [],
    stats: stats.data,
    isLoading,
    error,
    refresh: () => {
      mutate()
      stats.mutate()
      globalMutate((key) => Array.isArray(key) && key[0] === 'listings-feed')
    },
  }
}
