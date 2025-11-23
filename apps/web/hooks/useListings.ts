import useSWR from 'swr'
import { api } from '../lib/api'
import type { ListingsFeedResponse } from '../lib/api'

export function useListings(params: Record<string, string | number | undefined> = {}) {
  const key = ['listings', params]
  const { data, error, isLoading, isValidating, mutate } = useSWR<ListingsFeedResponse>(
    key,
    () => api.getListingsFeed(params),
    { revalidateOnFocus: false }
  )
  return { data, error, isLoading, isValidating, mutate }
}
