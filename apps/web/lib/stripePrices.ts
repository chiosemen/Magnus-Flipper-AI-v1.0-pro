/**
 * Stripe Price ID mapping (placeholders).
 *
 * IMPORTANT:
 * - The app must select a Stripe *Price ID* based on region.
 * - Never convert currency amounts in-app.
 * - Keep checkout logic separate from display pricing (`apps/web/lib/pricing.ts`).
 */
export const STRIPE_PRICE_IDS = {
  UK: {
    starter: "price_starter_gbp_monthly",
    pro: "price_pro_gbp_monthly",
    elite: "price_elite_gbp_monthly",
  },
  US: {
    starter: "price_starter_usd_monthly",
    pro: "price_pro_usd_monthly",
    elite: "price_elite_usd_monthly",
  },
} as const;
