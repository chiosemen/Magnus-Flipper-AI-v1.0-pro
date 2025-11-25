'use client'

import useSWR from 'swr'
import type { SavedSearch } from '@magnus-flipper-ai/core'
import type { SavedSearchPayload } from '@/lib/app-api'
import {
  getSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
} from '@/lib/app-api'

/**
 * Hook for managing saved searches
 * Provides CRUD operations and real-time data
 */
export function useSavedSearches() {
  const { data, error, isLoading, mutate } = useSWR<SavedSearch[]>(
    'saved-searches',
    getSavedSearches,
    { revalidateOnFocus: false }
  )

  return {
    searches: data || [],
    isLoading,
    error,
    refresh: mutate,
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

/**
 * Hook for fetching a single saved search by ID
 */
export function useSavedSearch(id?: string) {
  const { data, error, isLoading, mutate } = useSWR<SavedSearch>(
    id ? ['saved-search', id] : null,
    () => fetch(`/api/saved-searches/${id}`).then((res) => res.json()),
    { revalidateOnFocus: false }
  )

  return {
    search: data,
    isLoading,
    error,
    refresh: mutate,
  }
}
