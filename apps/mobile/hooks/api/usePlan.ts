/**
 * usePlan - React Query hook for user subscription plan
 * Uses @magnus-flipper-ai/core types
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SubscriptionPlan, PlanLimits } from '@magnus-flipper-ai/core';

interface PlanResponse {
  plan: SubscriptionPlan;
  limits: PlanLimits;
}

export function usePlan() {
  return useQuery<PlanResponse>({
    queryKey: ['plan'],
    queryFn: () => api.getPlan(),
    staleTime: 300000, // 5 minutes
  });
}

export function useSubscription() {
  return useQuery<{
    plan: SubscriptionPlan;
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    currentPeriodEnd?: string;
  }>({
    queryKey: ['subscription'],
    queryFn: () => api.getSubscription(),
    staleTime: 300000, // 5 minutes
  });
}
