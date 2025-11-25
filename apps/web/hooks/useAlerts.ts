import useSWR from 'swr'
import { api } from '../lib/api'
import type { Listing, ListingMatch, SavedSearch } from '@magnus-flipper-ai/core'
import type { AlertsStats } from '../lib/api'

export function useAlerts() {
  const recent = useSWR<Array<ListingMatch & { listing?: Listing; savedSearch?: SavedSearch }>>(
    'alerts-recent',
    () => api.getAlertsRecent(),
    { revalidateOnFocus: false }
  )
  const stats = useSWR<AlertsStats>('alerts-stats', () => api.getAlertsStats(), { revalidateOnFocus: false })
  return {
    data: recent.data,
    stats: stats.data,
    isLoading: recent.isLoading,
    error: recent.error,
    refresh: () => {
      recent.mutate()
      stats.mutate()
    },
  }
}
