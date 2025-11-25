'use client'

import useSWR from 'swr'
import type { PlanResponse } from '@/lib/app-api'
import { getPlan } from '@/lib/app-api'

const fetcher = (fn: () => Promise<any>) => fn()

export function usePlan() {
  const { data, error, isLoading, mutate } = useSWR<PlanResponse>(
    'plan',
    () => fetcher(getPlan),
    { revalidateOnFocus: false }
  )

  return {
    plan: data?.plan,
    limits: data?.limits,
    usage: data?.usage,
    isLoading,
    error,
    refresh: mutate,
  }
}
