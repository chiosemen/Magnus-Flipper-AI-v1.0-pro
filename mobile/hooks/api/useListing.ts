/**
 * useListing - React Query hook for individual listing details
 * Uses @magnus-flipper-ai/core types
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Listing } from '@magnus-flipper-ai/core';

export function useListing(listingId: string | undefined) {
  return useQuery<Listing>({
    queryKey: ['listing', listingId],
    queryFn: () => {
      if (!listingId) {
        throw new Error('Listing ID is required');
      }
      return api.getListing(listingId);
    },
    enabled: !!listingId,
    staleTime: 300000, // 5 minutes
  });
}
