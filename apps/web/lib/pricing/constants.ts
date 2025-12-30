export type PricingTier = {
  id: string;
  label: string;
  description: string;
  priceId: string;
  scans: number;
  marketplaces: string[];
  durationMinutes: number;
  highlight?: boolean;
};

const envPrice = (key: string) => process.env[key] || "";

export const PRICING_TIERS: Record<string, PricingTier> = {
  short: {
    id: "short",
    label: "Short Signal Access",
    description: "Quick scan window for a single market.",
    priceId: envPrice("NEXT_PUBLIC_STRIPE_PRICE_SHORT"),
    scans: 3,
    marketplaces: ["facebook"],
    durationMinutes: 5,
  },
  active: {
    id: "active",
    label: "Instant Scan Access",
    description: "Full session for priority signals.",
    priceId: envPrice("NEXT_PUBLIC_STRIPE_PRICE_ACTIVE"),
    scans: 5,
    marketplaces: ["facebook"],
    durationMinutes: 720,
    highlight: true,
  },
  wide: {
    id: "wide",
    label: "Wide Signal Access",
    description: "Multi-market session with wider coverage.",
    priceId: envPrice("NEXT_PUBLIC_STRIPE_PRICE_WIDE"),
    scans: 5,
    marketplaces: ["facebook", "gumtree", "vinted", "ebay", "offerup"],
    durationMinutes: 720,
  },
};

export const TIER_ORDER = ["active", "wide", "short"] as const;
