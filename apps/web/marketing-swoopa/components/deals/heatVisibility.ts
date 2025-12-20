import type { DealHeat } from "./dealUtils";
import type { PricingTier } from "./pricingTier";

export type HeatVisibility = {
  kind: "none" | "visible" | "locked";
  // What label to show (e.g. Starter never shows HOT; HOT downgrades to WARM).
  label: "HOT" | "WARM" | null;
  // Apply extra visual emphasis (Elite-only for HOT deals).
  emphasize: boolean;
};

export function getHeatVisibility(tier: PricingTier, heat: DealHeat): HeatVisibility {
  if (heat === "NORMAL") {
    return { kind: "none", label: null, emphasize: false };
  }

  switch (tier) {
    case "FREE_BASIC": {
      // Free/Basic: do not reveal HOT/WARM labels.
      // Alignment note: car alerts for this tier only fire for HOT deals, so we surface a "locked" badge
      // on HOT to avoid any alert firing for a deal that looks completely "normal" to the user.
      if (heat === "HOT") return { kind: "locked", label: null, emphasize: false };
      return { kind: "none", label: null, emphasize: false };
    }
    case "STARTER": {
      // Starter: WARM visible, HOT hidden (downgrade HOT to WARM for display).
      // This keeps alerts and visuals consistent: any alert-eligible deal shows a visible (WARM) badge.
      return { kind: "visible", label: "WARM", emphasize: false };
    }
    case "PRO": {
      return { kind: "visible", label: heat, emphasize: false };
    }
    case "ELITE": {
      return { kind: "visible", label: heat, emphasize: heat === "HOT" };
    }
    default: {
      return { kind: "none", label: null, emphasize: false };
    }
  }
}
