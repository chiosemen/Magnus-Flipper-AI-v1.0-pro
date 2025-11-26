"use client";

import useSWR from "swr";
import { getListingsFeed, type ListingsFeedResponse } from "@/lib/app-api";
import type { Listing } from "@magnus-flipper-ai/core";

interface ResultParams {
  searchId: string;
  page: number;
  pageSize: number;
  sort?: string;
}

export function useSearchResults(params: ResultParams) {
  const key = params.searchId ? ["search-results", params] : null;
  const { data, error, isLoading, mutate } = useSWR<ListingsFeedResponse>(
    key,
    () =>
      getListingsFeed({
        page: params.page,
        limit: params.pageSize,
        searchId: params.searchId,
      }),
    { revalidateOnFocus: false }
  );

  return {
    results: data?.listings || [],
    isLoading,
    error,
    isError: Boolean(error),
    refresh: mutate,
  };
}
