"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  motionDebugStore,
  type MotionDebugTier,
  type MotionDebugType,
} from "./motionDebugStore";

const DEV = process.env.NODE_ENV === "development";

export type MotionDebugOptions = {
  label?: string;
  type?: MotionDebugType;
  durationMs?: number | null;
  tier?: MotionDebugTier | string | null | undefined;
  repeat?: "none" | "infinite";
};

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `md_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function normalizeTier(value: MotionDebugOptions["tier"]): MotionDebugTier {
  if (typeof value !== "string") return "UNKNOWN";
  const v = value.trim().toUpperCase();
  if (v === "FREE" || v === "STARTER" || v === "PRO" || v === "ELITE") return v;
  if (v === "FREE_BASIC" || v === "BASIC") return "FREE";
  return "UNKNOWN";
}

type MotionDebugProps = {
  ref?: (node: HTMLElement | null) => void;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  "data-motion-debug-label"?: string;
  "data-motion-debug-type"?: MotionDebugType;
  "data-motion-debug-repeat"?: "none" | "infinite";
};

/**
 * Developer-only Framer Motion tracking helper.
 *
 * Guardrails:
 * - Opt-in only (requires `label`).
 * - No timers or polling.
 * - No re-renders triggered by the overlay (handlers check store state at runtime).
 */
export function useMotionDebug(options: MotionDebugOptions): MotionDebugProps {
  // Hard fail-safe: debug tracking should not impact production bundles.
  if (!DEV) return {};

  const idRef = useRef<string>(makeId());
  const elRef = useRef<HTMLElement | null>(null);

  const label = typeof options.label === "string" ? options.label.trim() : "";
  const type: MotionDebugType = options.type ?? "other";
  const repeat = options.repeat ?? "none";

  const ref = useCallback((node: HTMLElement | null) => {
    elRef.current = node;
    if (!node) {
      motionDebugStore.stop(idRef.current);
    }
  }, []);

  const start = useCallback(() => {
    if (!label) return;
    const { enabled } = motionDebugStore.getState();
    if (!enabled) return;

    const durationMs =
      typeof options.durationMs === "number" && Number.isFinite(options.durationMs)
        ? Math.max(0, Math.round(options.durationMs))
        : null;

    motionDebugStore.start({
      id: idRef.current,
      label,
      type,
      durationMs,
      tier: normalizeTier(options.tier),
      repeat,
      startedAt: Date.now(),
    });

    const el = elRef.current;
    if (!el) return;
    el.dataset.motionDebugActive = "1";
  }, [label, options.durationMs, options.tier, repeat, type]);

  const stop = useCallback(() => {
    if (!label) return;
    // Always clean up highlight state; store tracking is gated by `enabled`.
    const el = elRef.current;
    if (!el) return;
    delete el.dataset.motionDebugActive;

    const { enabled } = motionDebugStore.getState();
    if (!enabled) return;

    motionDebugStore.stop(idRef.current);
  }, [label]);

  return useMemo(() => {
    if (!label) return { ref };

    const base: MotionDebugProps = {
      ref,
      "data-motion-debug-label": label,
      "data-motion-debug-type": type,
      "data-motion-debug-repeat": repeat,
    };

    if (type === "hover") {
      return {
        ...base,
        onHoverStart: start,
        onHoverEnd: stop,
      };
    }

    return {
      ...base,
      onAnimationStart: start,
      onAnimationComplete: stop,
    };
  }, [label, ref, repeat, start, stop, type]);
}
