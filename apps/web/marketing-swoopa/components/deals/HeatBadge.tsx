"use client";

import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import type { DealHeat } from "./dealUtils";
import type { PricingTier } from "./pricingTier";
import { getHeatVisibility } from "./heatVisibility";
import { MOTION_TRANSITION } from "@/lib/motion";
import type { MotionSeverity } from "@/lib/motionSeverity";
import { useMotionDebug } from "@/lib/motionDebug";
import { useIsHydrated } from "@/providers/HydrationProvider";

const VISIBLE_STYLES: Record<
  Exclude<DealHeat, "NORMAL">,
  { label: string; className: string }
> = {
  HOT: {
    label: "HOT",
    className:
      "bg-red-500/20 text-red-200 border border-red-400/50 shadow-[0_0_18px_rgba(239,68,68,0.35)]",
  },
  WARM: {
    label: "WARM",
    className:
      "bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-[0_0_18px_rgba(245,158,11,0.25)]",
  },
};

export type HeatBadgeMotion = Pick<
  MotionSeverity,
  "reducedMotion" | "hotPulseSec" | "emphasisScale"
>;

export function HeatBadge({
  heat,
  tier,
  motion: motionConfig,
  debugLabel,
}: {
  heat: DealHeat;
  tier: PricingTier;
  motion: HeatBadgeMotion;
  debugLabel?: string;
}) {
  const hydrated = useIsHydrated();
  const visibility = getHeatVisibility(tier, heat);
  if (visibility.kind === "none") return null;

  if (visibility.kind === "locked") {
    return (
      <span className="pointer-events-none inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold tracking-wide bg-white/5 text-white/70 border border-white/15">
        <Lock className="h-3 w-3" />
        Upgrade
      </span>
    );
  }

  const shouldPulseHot =
    hydrated &&
    !motionConfig.reducedMotion &&
    visibility.label === "HOT" &&
    motionConfig.hotPulseSec > 0;

  const debug = useMotionDebug({
    label: shouldPulseHot ? debugLabel : undefined,
    type: "pulse",
    repeat: shouldPulseHot ? "infinite" : "none",
    durationMs: shouldPulseHot ? Math.round(motionConfig.hotPulseSec * 1000) : null,
    tier,
  });

  return (
    <motion.span
      className={`pointer-events-none inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold tracking-wide ${
        visibility.label === "HOT" ? VISIBLE_STYLES.HOT.className : VISIBLE_STYLES.WARM.className
      } ${visibility.emphasize ? "shadow-[0_0_28px_rgba(239,68,68,0.45)]" : ""}`}
      animate={
        shouldPulseHot
          ? { scale: [1, motionConfig.emphasisScale, 1], opacity: [1, 0.92, 1] }
          : undefined
      }
      transition={
        shouldPulseHot
          ? { ...MOTION_TRANSITION.badgePulse, duration: motionConfig.hotPulseSec, repeat: Infinity }
          : undefined
      }
      {...debug}
    >
      {visibility.label}
    </motion.span>
  );
}
