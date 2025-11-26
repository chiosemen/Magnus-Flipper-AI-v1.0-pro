'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import type { Listing, ListingMatch, SavedSearch } from '@magnus-flipper-ai/core';
import { getAlertsRecent, getAlertsStats } from '@/lib/app-api';
import type { AlertsStats } from '@/lib/app-api';

const fetcher = (fn: () => Promise<any>) => fn();

export function useAlerts() {
  const { data, error, isLoading, mutate } = useSWR<Array<ListingMatch & { listing: Listing; savedSearch: SavedSearch }>>(
    'alerts-recent',
    () => fetcher(getAlertsRecent),
    { revalidateOnFocus: false }
  );

  const stats = useSWR<AlertsStats>('alerts-stats', () => fetcher(getAlertsStats), {
    revalidateOnFocus: false,
  });

  if (error) {
    return { alerts: [], stats: stats.data, isLoading: false, error, isError: true };
  }

  return {
    alerts: data || [],
    stats: stats.data,
    isLoading,
    error: null,
    isError: false,
    refresh: () => {
      mutate();
      stats.mutate();
      globalMutate((key) => Array.isArray(key) && key[0] === 'listings-feed');
    },
  };
}
