"use client";

import { useIsHydrated } from "@/providers/HydrationProvider";

/**
 * Returns `Date.now()` only after hydration to avoid SSR/CSR divergence.
 * No timers; updates only on re-render.
 */
export function useHydratedNow(): number | null {
  const hydrated = useIsHydrated();
  return hydrated ? Date.now() : null;
}

