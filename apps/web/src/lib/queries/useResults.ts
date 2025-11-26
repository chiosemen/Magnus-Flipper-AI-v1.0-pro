"use client";

import useSWR from "swr";
import type { ListingsFeedResponse } from "@/lib/app-api";
import { getListingsFeed } from "@/lib/app-api";

export interface ResultFilters {
  q?: string;
  category?: string;
  marketplace?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  radiusMiles?: number;
  condition?: string;
  manufacturer?: string;
  models?: string[];
  local?: boolean;
  includeSold?: boolean;
  page: number;
  pageSize: number;
}

export function useResults(filters: ResultFilters) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.pageSize));
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.marketplace) params.set("marketplace", filters.marketplace);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.radiusMiles !== undefined) params.set("radiusMiles", String(filters.radiusMiles));
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.manufacturer) params.set("manufacturer", filters.manufacturer);
  if (filters.models?.length) params.set("models", filters.models.join(","));
  if (filters.local) params.set("local", "true");
  if (filters.includeSold) params.set("includeSold", "true");

  const key = ["results", params.toString()];
  const { data, isLoading, error, mutate } = useSWR<ListingsFeedResponse>(
    key,
    () => getListingsFeed(Object.fromEntries(params)),
    { revalidateOnFocus: false }
  );

  return {
    listings: data?.listings || [],
    isLoading,
    error,
    isError: Boolean(error),
    refresh: mutate,
  };
}
