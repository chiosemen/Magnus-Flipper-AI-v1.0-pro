"use client";

import React, { useEffect } from "react";
import { useSyncExternalStore } from "react";

let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return hydrated;
}

/**
 * Tracks whether the app has finished client hydration.
 *
 * Guardrails:
 * - Deterministic SSR/CSR: defaults to `false` everywhere, flips to `true` only after mount.
 * - No timers, no polling.
 */
export function HydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    emit();
  }, []);

  return <>{children}</>;
}

export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
