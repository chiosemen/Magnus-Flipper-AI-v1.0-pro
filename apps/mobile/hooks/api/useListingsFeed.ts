/**
 * useListingsFeed - React Query hook for listings feed with infinite scroll
 * Uses @magnus-flipper-ai/core types
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ListingsFeedRequest, ListingsFeedResponse } from '@magnus-flipper-ai/core';

export function useListingsFeed(params?: Partial<ListingsFeedRequest>) {
  return useInfiniteQuery<ListingsFeedResponse>({
    queryKey: ['listings', 'feed', params],
    queryFn: async ({ pageParam = 1 }) => {
      return api.getListingsFeed({
        ...params,
        page: pageParam as number,
        pageSize: params?.pageSize || 20,
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.total || !lastPage?.page || !lastPage?.pageSize) {
        return undefined;
      }
      const nextPage = lastPage.page + 1;
      const maxPages = Math.ceil(lastPage.total / lastPage.pageSize);
      return nextPage <= maxPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Alias for backward compatibility
 */
export const useListings = useListingsFeed;
