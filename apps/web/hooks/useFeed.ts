"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { FeedResponse, FeedQueryParams } from "@magnus-flipper-ai/core/types/feed";

interface UseFeedOptions {
  marketplaces?: string[];
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  deduplicate?: boolean;
  rank?: boolean;
  enabled?: boolean;
}

/**
 * Hook to fetch paginated feed data
 */
export function useFeed(options: UseFeedOptions = {}) {
  const {
    marketplaces = [],
    limit = 50,
    minPrice,
    maxPrice,
    deduplicate = true,
    rank = true,
    enabled = true,
  } = options;

  const params: FeedQueryParams = {
    limit: limit.toString(),
    deduplicate: deduplicate.toString(),
    rank: rank.toString(),
  };

  if (marketplaces.length > 0) {
    params.marketplaces = marketplaces.join(",");
  }

  if (minPrice !== undefined) {
    params.minPrice = minPrice.toString();
  }

  if (maxPrice !== undefined) {
    params.maxPrice = maxPrice.toString();
  }

  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery<FeedResponse>({
    queryKey: ["feed", params],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/search/feed?${queryString}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }

      return response.json();
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch infinite feed data (for infinite scroll)
 */
export function useInfiniteFeed(options: UseFeedOptions = {}) {
  const {
    marketplaces = [],
    limit = 50,
    minPrice,
    maxPrice,
    deduplicate = true,
    rank = true,
    enabled = true,
  } = options;

  return useInfiniteQuery<FeedResponse, Error, FeedResponse, readonly unknown[], string | undefined>({
    queryKey: ["feed", "infinite", options],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const params: FeedQueryParams = {
        limit: limit.toString(),
        deduplicate: deduplicate.toString(),
        rank: rank.toString(),
      };

      if (marketplaces.length > 0) {
        params.marketplaces = marketplaces.join(",");
      }

      if (minPrice !== undefined) {
        params.minPrice = minPrice.toString();
      }

      if (maxPrice !== undefined) {
        params.maxPrice = maxPrice.toString();
      }

      if (pageParam) {
        params.cursor = pageParam as string;
      }

      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/search/feed?${queryString}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }

      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined;
    },
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}
