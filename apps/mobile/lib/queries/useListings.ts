"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useListingsFeed() {
  const query = useQuery({
    queryKey: ["listings-feed"],
    queryFn: api.listings.list,
    staleTime: 10_000,
    retry: false,
  });

  return {
    feed: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useListing(id?: string) {
  const query = useQuery({
    queryKey: ["listing", id],
    queryFn: () => api.listings.detail(id || ""),
    enabled: Boolean(id),
    staleTime: 10_000,
    retry: false,
  });

  return {
    listing: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
