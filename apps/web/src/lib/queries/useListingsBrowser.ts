"use client";

import useSWR from "swr";
import type { ListingsFeedResponse } from "@/lib/app-api";
import { getListingsFeed } from "@/lib/app-api";

export interface BrowserFilters {
  marketplace?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  sort?: string;
  page: number;
  pageSize: number;
}

export function useListingsBrowser(filters: BrowserFilters) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("limit", String(filters.pageSize));
  if (filters.marketplace) params.set("marketplace", filters.marketplace);
  if (filters.category) params.set("category", filters.category);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort) params.set("sort", filters.sort);

  const key = ["browser-feed", params.toString()];
  const { data, error, isLoading, isValidating, mutate } = useSWR<ListingsFeedResponse>(
    key,
    () => getListingsFeed(Object.fromEntries(params)),
    { revalidateOnFocus: false }
  );

  return {
    listings: data?.listings || [],
    total: data?.total || 0,
    isLoading,
    isValidating,
    error,
    isError: Boolean(error),
    refresh: mutate,
  };
}
