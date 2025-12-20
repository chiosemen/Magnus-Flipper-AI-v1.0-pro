export type PricingTier = "FREE_BASIC" | "STARTER" | "PRO" | "ELITE";

export function normalizePricingTier(input: unknown): PricingTier {
  if (typeof input !== "string") return "FREE_BASIC";
  const value = input.trim().toLowerCase();
  if (!value) return "FREE_BASIC";

  if (value === "free" || value === "basic" || value === "free/basic" || value === "free_basic") {
    return "FREE_BASIC";
  }
  if (value === "starter") return "STARTER";
  if (value === "pro" || value === "premium") return "PRO";
  if (value === "elite" || value === "agency" || value === "ultra") return "ELITE";

  // Best-effort matching for arbitrary plan ids/labels.
  if (value.includes("starter")) return "STARTER";
  if (value.includes("elite") || value.includes("agency") || value.includes("ultra")) return "ELITE";
  if (value.includes("pro") || value.includes("premium")) return "PRO";
  if (value.includes("free") || value.includes("basic")) return "FREE_BASIC";

  return "FREE_BASIC";
}

