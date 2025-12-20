"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

export const MOTION_EASE = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
} as const;

export const MOTION_DURATION = {
  fast: 0.25,
  base: 0.3,
  slow: 0.4,
} as const;

export const MOTION_TRANSITION = {
  fadeUpFast: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.out },
  fade: { duration: 0.18, ease: MOTION_EASE.inOut },
  sheet: { duration: 0.22, ease: MOTION_EASE.out },
  badgePulse: { duration: 2.6, ease: MOTION_EASE.inOut },
} as const;

export type MotionPrefs = {
  reducedMotion: boolean;
  canHover: boolean;
};

function useCanHover(): boolean {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(Boolean(mql.matches));
    update();

    // Safari < 14 fallback: addListener/removeListener.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  return canHover;
}

/**
 * Centralized motion preferences.
 * - Respects `prefers-reduced-motion` automatically via Framer Motion.
 * - Disables hover-only motion on touch devices.
 */
export function useMotionPrefs(): MotionPrefs {
  const reducedMotion = useReducedMotion();
  const canHover = useCanHover();

  return useMemo(
    () => ({
      reducedMotion: Boolean(reducedMotion),
      canHover,
    }),
    [reducedMotion, canHover]
  );
}

