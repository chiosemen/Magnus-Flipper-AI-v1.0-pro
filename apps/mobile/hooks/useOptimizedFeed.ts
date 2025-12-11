/**
 * Optimized Feed Hook
 * Enhanced feed hook with offline support and deal notifications
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useListingsFeed } from './useListingsFeed';
import { useNetworkStatus } from '@/lib/offline';
import { checkAndNotifyNewDeals, setupDealNotificationListener } from '@/lib/dealNotifications';
import type { Listing } from '@magnus-flipper-ai/core';

interface UseOptimizedFeedOptions {
  onNewDeal?: (listing: Listing) => void;
  enableNotifications?: boolean;
}

/**
 * Optimized feed hook with:
 * - Offline support
 * - Deal notifications
 * - Performance optimizations
 */
export function useOptimizedFeed(options: UseOptimizedFeedOptions = {}) {
  const { onNewDeal, enableNotifications = true } = options;
  const { isOffline } = useNetworkStatus();
  const previousListingIdsRef = useRef<Set<string>>(new Set());
  const [hasNewDeals, setHasNewDeals] = useState(false);

  const feedQuery = useListingsFeed({
    pageSize: 20,
    enabled: true,
  });

  // Use memoized listings from hook
  const listings = feedQuery.listings as Listing[];

  // Track listing IDs for notification detection
  useEffect(() => {
    const currentIds = new Set(listings.map((l) => l.id));
    
    // Check for new deals
    if (enableNotifications && previousListingIdsRef.current.size > 0) {
      checkAndNotifyNewDeals(listings, previousListingIdsRef.current).then(() => {
        setHasNewDeals(true);
        setTimeout(() => setHasNewDeals(false), 5000);
      });
    }

    previousListingIdsRef.current = currentIds;
  }, [listings, enableNotifications]);

  // Setup notification listener
  useEffect(() => {
    if (!enableNotifications || !onNewDeal) return;

    const unsubscribe = setupDealNotificationListener((listing) => {
      onNewDeal(listing);
    });

    return unsubscribe;
  }, [enableNotifications, onNewDeal]);

  // Enhanced fetch next page with better offline handling
  const fetchNextPage = useCallback(() => {
    // Only fetch if online and has more pages
    if (isOffline) {
      console.log('[Feed] Skipping fetch - offline mode');
      return;
    }

    if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      feedQuery.fetchNextPage();
    }
  }, [isOffline, feedQuery]);

  // Enhanced data fetching with better caching
  const refetch = useCallback(() => {
    if (!isOffline) {
      feedQuery.refetch();
    }
  }, [isOffline, feedQuery]);

  return {
    ...feedQuery,
    listings,
    fetchNextPage,
    refetch,
    isOffline,
    hasNewDeals,
    isLoading: feedQuery.isLoading || feedQuery.isPending,
    // Enhanced status indicators
    isRefetching: feedQuery.isRefetching,
    isStale: feedQuery.isStale,
  };
}
