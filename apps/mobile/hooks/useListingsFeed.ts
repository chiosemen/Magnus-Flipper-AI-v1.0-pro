/**
 * Listings Feed Hook
 * Optimized infinite query hook for feed with better virtualization support
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { useNetworkStatus } from '@/lib/offline';

interface UseListingsFeedOptions {
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Optimized listings feed hook with:
 * - Infinite scrolling
 * - Offline support
 * - Better caching
 * - Virtualization-friendly data structure
 */
export function useListingsFeed(options: UseListingsFeedOptions = {}) {
  const { pageSize = 20, enabled = true, staleTime = 10 * 60 * 1000 } = options;
  const { isOffline } = useNetworkStatus();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['listings', 'feed', { pageSize }],
    queryFn: async ({ pageParam = 1, signal }) => {
      const response = await api.getListingsFeed(
        {
          page: pageParam,
          pageSize,
        },
        signal
      );
      return response;
    },
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.total || !lastPage?.page || !lastPage?.pageSize) return undefined;
      const next = lastPage.page + 1;
      const max = Math.ceil(lastPage.total / lastPage.pageSize);
      return next <= max ? next : undefined;
    },
    enabled: enabled && !isOffline, // Disable when offline
    staleTime,
    // Enhanced caching for offline support
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
    // Better retry logic
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2; // Reduced retries for faster failure
    },
    // Network mode
    networkMode: 'offlineFirst',
  });

  // Memoized flattened listings for better performance
  const listings = useMemo(() => {
    return (query.data?.pages || []).flatMap((p: any) => p?.listings || []);
  }, [query.data?.pages]);

  // Optimized fetch next page
  const fetchNextPage = useCallback(() => {
    if (!isOffline && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [isOffline, query]);

  // Prefetch next page for smoother scrolling
  const prefetchNextPage = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage && !isOffline) {
      const nextPage = query.data?.pages.length ? query.data.pages.length + 1 : 1;
      queryClient.prefetchInfiniteQuery({
        queryKey: ['listings', 'feed', { pageSize }],
        queryFn: async ({ pageParam = nextPage, signal }) => {
          return api.getListingsFeed({ page: pageParam, pageSize }, signal);
        },
      });
    }
  }, [query, queryClient, pageSize, isOffline]);

  return {
    ...query,
    listings,
    fetchNextPage,
    prefetchNextPage,
    isOffline,
  };
}
