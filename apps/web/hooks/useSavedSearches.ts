import useSWR from 'swr'
import { api, SavedSearchPayload } from '../lib/api'
import type { SavedSearch } from '@magnus-flipper-ai/core'

export function useSavedSearches() {
  const { data, error, isLoading, mutate } = useSWR<SavedSearch[]>(
    'saved-searches',
    () => api.getSavedSearches(),
    { revalidateOnFocus: false }
  )

  const create = (payload: SavedSearchPayload) => api.createSavedSearch(payload).then(() => mutate())
  const update = (id: string, payload: SavedSearchPayload) => api.updateSavedSearch(id, payload).then(() => mutate())
  const remove = (id: string) => api.deleteSavedSearch(id).then(() => mutate())

  return { data, error, isLoading, mutate, create, update, remove }
}
