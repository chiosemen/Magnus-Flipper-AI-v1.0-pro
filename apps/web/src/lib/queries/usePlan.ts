'use client'

import useSWR from 'swr'
import type { PlanUsage } from '@/lib/app-api'
import { getPlan } from '@/lib/app-api'

/**
 * Hook for fetching current plan and usage data
 * Returns plan details, current usage, and limits
 */
export function usePlan() {
  const { data, error, isLoading, mutate } = useSWR<PlanUsage>(
    'plan',
    getPlan,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    plan: data?.plan,
    usage: data?.usage,
    limits: data?.limits,
    isLoading,
    error,
    refresh: mutate,
  }
}
