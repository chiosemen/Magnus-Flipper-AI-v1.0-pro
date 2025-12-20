/**
 * Canonical display pricing by region.
 *
 * IMPORTANT:
 * - These are intentional price points (no FX conversion, no derived math).
 * - UI can read from this for display, but checkout must select a Stripe Price ID
 *   (see `apps/web/lib/stripePrices.ts`) rather than using these numbers.
 */
export const PRICING = {
  UK: {
    currency: "GBP",
    symbol: "£",
    plans: {
      starter: { monthly: 29 },
      pro: { monthly: 79 },
      elite: { monthly: 149 },
    },
  },
  US: {
    currency: "USD",
    symbol: "$",
    plans: {
      starter: { monthly: 39 },
      pro: { monthly: 99 },
      elite: { monthly: 179 },
    },
  },
  ROW: {
    currency: "USD",
    symbol: "$",
    plans: {
      starter: { monthly: 39 },
      pro: { monthly: 99 },
      elite: { monthly: 179 },
    },
  },
} as const;
