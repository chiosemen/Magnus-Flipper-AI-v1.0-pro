'use client';

import useSWR from 'swr';
import type { PlanResponse } from '@/lib/app-api';
import { getPlan } from '@/lib/app-api';

const fetcher = (fn: () => Promise<any>) => fn();

export function usePlan() {
  const { data, error, isLoading, mutate } = useSWR<PlanResponse>('plan', () => fetcher(getPlan), {
    revalidateOnFocus: false,
  });

  if (error) {
    return {
      plan: undefined,
      limits: undefined,
      usage: undefined,
      isLoading: false,
      error,
      refresh: mutate,
      isError: true,
    };
  }

  return {
    plan: data?.plan,
    limits: data?.limits,
    usage: data?.usage,
    isLoading,
    error: null,
    refresh: mutate,
    isError: false,
  };
}
