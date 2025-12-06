import Stripe from "stripe";

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getStripeClient(): Stripe {
  return new Stripe(getEnvVar("STRIPE_SECRET_KEY"), {
    apiVersion: "2025-10-29.clover" as any,
    typescript: true,
  });
}

export function getStripeConfig() {
  return {
    PRICE_PRO: getEnvVar("STRIPE_PRICE_PRO"),
    PRICE_AGENCY: getEnvVar("STRIPE_PRICE_AGENCY"),
    WEBHOOK_SECRET: getEnvVar("STRIPE_WEBHOOK_SECRET"),
  };
}

export function getPriceIdForTier(tier: "PRO" | "AGENCY"): string {
  const config = getStripeConfig();
  if (tier === "PRO") return config.PRICE_PRO;
  if (tier === "AGENCY") return config.PRICE_AGENCY;
  throw new Error(`Invalid tier: ${tier}`);
}
