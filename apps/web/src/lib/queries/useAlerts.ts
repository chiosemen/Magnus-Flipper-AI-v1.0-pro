'use client'

import useSWR, { mutate as globalMutate } from 'swr'
import type { Listing, ListingMatch, SavedSearch } from '@magnus-flipper-ai/core'
import type { AlertsStats } from '@/lib/app-api'
import { getAlertsRecent, getAlertsStats } from '@/lib/app-api'

export type AlertWithDetails = ListingMatch & {
  listing: Listing
  savedSearch?: SavedSearch
}

/**
 * Hook for fetching alerts and alert statistics
 * Provides recent alerts and aggregated stats
 */
export function useAlerts() {
  const { data, error, isLoading, mutate } = useSWR<AlertWithDetails[]>(
    'alerts-recent',
    getAlertsRecent,
    { revalidateOnFocus: false }
  )

  const stats = useSWR<AlertsStats>('alerts-stats', getAlertsStats, {
    revalidateOnFocus: false,
  })

  return {
    alerts: data || [],
    stats: stats.data,
    isLoading,
    error,
    refresh: () => {
      mutate()
      stats.mutate()
      // Also refresh listings feed to show new matches
      globalMutate((key) => Array.isArray(key) && key[0] === 'listings-feed')
    },
  }
}

/**
 * Hook for fetching alert statistics only
 */
export function useAlertStats() {
  const { data, error, isLoading, mutate } = useSWR<AlertsStats>(
    'alerts-stats',
    getAlertsStats,
    { revalidateOnFocus: false }
  )

  return {
    stats: data,
    isLoading,
    error,
    refresh: mutate,
  }
}
