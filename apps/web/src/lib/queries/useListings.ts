'use client'

import useSWR from 'swr'
import type { Listing } from '@magnus-flipper-ai/core'
import type { ListingsFeedResponse } from '@/lib/app-api'
import { getListingsFeed, getListing } from '@/lib/app-api'

export interface ListingsFeedParams {
  page?: number
  pageSize?: number
  savedSearchId?: string
  site?: string
  category?: string
}

/**
 * Hook for fetching paginated listings feed
 * Supports filtering by search, site, category
 */
export function useListingsFeed(params: ListingsFeedParams = {}) {
  const key = ['listings-feed', params]
  const { data, error, isLoading, isValidating, mutate } = useSWR<ListingsFeedResponse>(
    key,
    () => getListingsFeed(params),
    { revalidateOnFocus: false }
  )

  return {
    feed: data,
    listings: data?.listings || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 20,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  }
}

/**
 * Hook for fetching a single listing by ID
 */
export function useListing(id?: string) {
  const { data, error, isLoading, mutate } = useSWR<Listing>(
    id ? ['listing', id] : null,
    () => getListing(id!),
    { revalidateOnFocus: false }
  )

  return {
    listing: data,
    isLoading,
    error,
    refresh: mutate,
  }
}
