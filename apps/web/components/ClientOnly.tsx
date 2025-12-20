"use client";

import React from "react";
import { useIsHydrated } from "@/providers/HydrationProvider";

/**
 * Client-only rendering boundary to avoid SSR/CSR divergence.
 * Use sparingly (debug overlays, inspectors).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hydrated = useIsHydrated();
  return <>{hydrated ? children : fallback}</>;
}

