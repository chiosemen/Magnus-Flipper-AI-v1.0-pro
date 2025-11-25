/**
 * useAlerts - React Query hook for recent alerts/matches
 * Uses @magnus-flipper-ai/core types
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AlertsRecentResponse } from '@magnus-flipper-ai/core';

export function useAlerts() {
  return useQuery<AlertsRecentResponse>({
    queryKey: ['alerts', 'recent'],
    queryFn: () => api.getRecentAlerts(),
    staleTime: 30000, // 30 seconds (more frequent for alerts)
    refetchInterval: 60000, // Auto-refetch every minute
  });
}

export function useAlertsStats() {
  return useQuery<{ total: number; unread: number }>({
    queryKey: ['alerts', 'stats'],
    queryFn: () => api.getAlertsStats(),
    staleTime: 30000, // 30 seconds
  });
}
