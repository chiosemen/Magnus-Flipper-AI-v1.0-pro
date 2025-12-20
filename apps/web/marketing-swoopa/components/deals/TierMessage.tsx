"use client";

import type { PricingTier } from "./pricingTier";

const MESSAGES: Record<PricingTier, string | null> = {
  FREE_BASIC: "Upgrade to see hot deals sooner",
  STARTER: "Pro unlocks instant hot alerts",
  PRO: "Elite surfaces edge-case opportunities",
  ELITE: null,
};

export function TierMessage({
  tier,
  className = "",
}: {
  tier: PricingTier;
  className?: string;
}) {
  const message = MESSAGES[tier];
  if (!message) return null;

  return (
    <div className={`text-xs text-white/50 font-medium ${className}`}>
      {message}
    </div>
  );
}

