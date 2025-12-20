"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";

export type MotionSeverityTier = "FREE" | "STARTER" | "PRO" | "ELITE";

export type MotionSeverityConfig = {
  baseDurationMs: number;
  baseEase: [number, number, number, number];
  staggerDelayMs: number;
  hoverLiftPx: number;
  emphasisScale: number;
};

const BASE_EASE: MotionSeverityConfig["baseEase"] = [0.16, 1, 0.3, 1];

/**
 * Centralized tier → motion severity map.
 *
 * Guardrails:
 * - Subtle differences only (timing + intensity), never direction/style changes.
 * - Lower tiers remain fast (never sluggish), higher tiers feel slightly snappier.
 * - Curves are consistent across tiers (same cubic-bezier), only values change.
 */
export const MOTION_SEVERITY: Record<MotionSeverityTier, MotionSeverityConfig> = {
  FREE: {
    baseDurationMs: 240,
    baseEase: BASE_EASE,
    staggerDelayMs: 45,
    hoverLiftPx: 1,
    emphasisScale: 1.02,
  },
  STARTER: {
    baseDurationMs: 220,
    baseEase: BASE_EASE,
    staggerDelayMs: 40,
    hoverLiftPx: 2,
    emphasisScale: 1.025,
  },
  PRO: {
    baseDurationMs: 205,
    baseEase: BASE_EASE,
    staggerDelayMs: 35,
    hoverLiftPx: 2,
    emphasisScale: 1.03,
  },
  ELITE: {
    baseDurationMs: 190,
    baseEase: BASE_EASE,
    staggerDelayMs: 30,
    hoverLiftPx: 3,
    emphasisScale: 1.03,
  },
};

function normalizeTier(value: unknown): MotionSeverityTier {
  if (typeof value !== "string") return "FREE";
  const v = value.trim().toUpperCase();
  if (!v) return "FREE";

  // Known tiers
  if (v === "FREE") return "FREE";
  if (v === "STARTER") return "STARTER";
  if (v === "PRO") return "PRO";
  if (v === "ELITE") return "ELITE";

  // Back-compat / app-specific variants
  if (v === "FREE_BASIC" || v === "FREE/BASIC" || v === "BASIC") return "FREE";

  if (v.includes("ELITE") || v.includes("AGENCY")) return "ELITE";
  if (v.includes("PRO") || v.includes("PREMIUM")) return "PRO";
  if (v.includes("STARTER")) return "STARTER";
  if (v.includes("FREE") || v.includes("BASIC")) return "FREE";

  return "FREE";
}

export type MotionSeverity = MotionSeverityConfig & {
  tier: MotionSeverityTier;
  reducedMotion: boolean;
  // Convenience helpers for Framer Motion (seconds).
  durationSec: number;
  staggerSec: number;
  // HOT badge pulse cadence (seconds). Kept subtle; Elite slightly quicker.
  hotPulseSec: number;
};

/**
 * Runtime-safe tier → motion severity hook.
 *
 * Constraints:
 * - No timers, no polling, no side effects.
 * - Automatically bypasses the severity map when prefers-reduced-motion is enabled.
 */
export function useMotionSeverity(tierInput: unknown): MotionSeverity {
  const reducedMotion = useReducedMotion();

  return useMemo(() => {
    const tier = normalizeTier(tierInput);
    const base = MOTION_SEVERITY[tier] ?? MOTION_SEVERITY.FREE;

    if (reducedMotion) {
      return {
        tier,
        reducedMotion: true,
        baseDurationMs: 0,
        baseEase: base.baseEase,
        staggerDelayMs: 0,
        hoverLiftPx: 0,
        emphasisScale: 1,
        durationSec: 0,
        staggerSec: 0,
        hotPulseSec: 0,
      };
    }

    // Keep pulse cadence subtle; Elite feels a touch snappier (not flashier).
    const hotPulseSec = tier === "ELITE" ? 2.4 : tier === "PRO" ? 2.7 : 0;

    return {
      tier,
      reducedMotion: false,
      ...base,
      durationSec: base.baseDurationMs / 1000,
      staggerSec: base.staggerDelayMs / 1000,
      hotPulseSec,
    };
  }, [reducedMotion, tierInput]);
}

