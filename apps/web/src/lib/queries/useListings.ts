'use client';

import useSWR from 'swr';
import type { Listing } from '@magnus-flipper-ai/core';
import { getListing, getListingsFeed } from '@/lib/app-api';
import type { ListingsFeedResponse } from '@/lib/app-api';

const fetcher = (fn: () => Promise<any>) => fn();

export function useListingsFeed(params: Record<string, string | number | undefined> = {}) {
  const key = ['listings-feed', params];
  const { data, error, isLoading, isValidating, mutate } = useSWR<ListingsFeedResponse>(
    key,
    () => fetcher(() => getListingsFeed(params)),
    { revalidateOnFocus: false }
  );

  if (error) return { feed: { listings: [], total: 0, page: 1, pageSize: 0 }, isLoading: false, isError: true };

  return { feed: data, isLoading, isValidating, error: null, isError: false, refresh: mutate };
}

export function useListing(id?: string) {
  const { data, error, isLoading } = useSWR<Listing>(
    id ? ['listing', id] : null,
    () => fetcher(() => getListing(id!)),
    { revalidateOnFocus: false }
  );

  if (error) return { listing: undefined, error, isLoading: false, isError: true };

  return { listing: data, error: null, isLoading, isError: false };
}
