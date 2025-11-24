'use client'

import { createCheckoutSession, createBillingPortalSession } from '@/lib/app-api'

export function useBilling() {
  const createCheckout = async (planId: string) => {
    const { url } = await createCheckoutSession(planId)
    if (url) {
      window.location.href = url
    }
    return url
  }

  const createPortal = async () => {
    const { url } = await createBillingPortalSession()
    if (url) {
      window.location.href = url
    }
    return url
  }

  return {
    createCheckout,
    createPortal,
  }
}
