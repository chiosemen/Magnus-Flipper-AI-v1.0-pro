/**
 * useTrialCheckout - React Query hook for trial checkout with Stripe
 * Handles mobile trial activation flow
 */

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface TrialCheckoutResponse {
  sessionUrl: string;
  clientSecret?: string;
}

export function useTrialCheckout() {
  return useMutation<TrialCheckoutResponse>({
    mutationFn: () => api.createTrialCheckout(),
  });
}

export function useBillingPortal() {
  return useMutation<{ portalUrl: string }>({
    mutationFn: () => api.getBillingPortalUrl(),
  });
}
