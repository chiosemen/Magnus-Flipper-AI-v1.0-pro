"use client";

import { useIsHydrated } from "@/providers/HydrationProvider";

type MotionProps = Record<string, unknown> & { initial?: unknown };

/**
 * Hydration-safe motion props.
 *
 * Behavior:
 * - Before hydration completes, force `initial={false}` to keep SSR/CSR markup deterministic.
 * - After hydration, return the caller's motion props unchanged so new mounts/transitions can animate.
 */
export function useHydratedMotionProps<T extends MotionProps>(
  props: T
): T {
  const hydrated = useIsHydrated();
  if (!hydrated) return { ...props, initial: false } as T;
  return props;
}
