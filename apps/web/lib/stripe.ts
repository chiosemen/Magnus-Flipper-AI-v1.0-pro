import Stripe from "stripe";

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const stripe = new Stripe(getEnvVar("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-04-10",
  typescript: true,
});

export const STRIPE_CONFIG = {
  PRICE_PRO: getEnvVar("STRIPE_PRICE_PRO"),
  PRICE_AGENCY: getEnvVar("STRIPE_PRICE_AGENCY"),
  WEBHOOK_SECRET: getEnvVar("STRIPE_WEBHOOK_SECRET"),
};

export function getPriceIdForTier(tier: "PRO" | "AGENCY"): string {
  if (tier === "PRO") return STRIPE_CONFIG.PRICE_PRO;
  if (tier === "AGENCY") return STRIPE_CONFIG.PRICE_AGENCY;
  throw new Error(`Invalid tier: ${tier}`);
}
