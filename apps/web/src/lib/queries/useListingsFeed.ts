"use client";

import useSWR from "swr";
import type { ListingsFeedResponse } from "@/lib/app-api";
import { getListingsFeed } from "@/lib/app-api";

interface FeedParams {
  page: number;
  pageSize: number;
}

const fetcher = (args: FeedParams) => getListingsFeed({ page: args.page, pageSize: args.pageSize });

export function useListingsFeed(params: FeedParams) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ListingsFeedResponse>(
    ["listings-feed", params],
    () => fetcher(params),
    { revalidateOnFocus: false }
  );

  return {
    feed: data,
    isLoading,
    isValidating,
    error,
    isError: Boolean(error),
    refresh: mutate,
  };
}
