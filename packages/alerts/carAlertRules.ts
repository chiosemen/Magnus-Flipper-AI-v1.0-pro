export type CarAlertRuleInput = {
  dealScore?: number | null;
  estimatedProfit?: number | null;
  sellerType?: "dealer" | "private" | "unknown" | null;
  listingCreatedAt?: string | number | Date | null;
  minEstimatedProfit?: number | null;
  nowMs?: number | null;
};

export type PricingTier = "FREE_BASIC" | "STARTER" | "PRO" | "ELITE";

export type CarDealAlertInput = {
  score?: number | null;
  price?: number | null;
  mileage?: number | null;
  created_at?: string | number | Date | null;
  createdAt?: string | number | Date | null;
};

import { getAlertThresholds } from "./alertThresholds.js";

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function safeNowMs(nowMs: unknown): number {
  const parsed = safeNumber(nowMs);
  return typeof parsed === "number" ? parsed : Date.now();
}

function parseTimestampMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

function normalizePricingTier(input: unknown): PricingTier {
  if (typeof input !== "string") return "FREE_BASIC";
  const value = input.trim().toLowerCase();
  if (!value) return "FREE_BASIC";

  if (value === "free" || value === "basic" || value === "free/basic" || value === "free_basic") {
    return "FREE_BASIC";
  }
  if (value === "starter") return "STARTER";
  if (value === "pro" || value === "premium") return "PRO";
  if (value === "elite" || value === "agency" || value === "ultra" || value === "admin") return "ELITE";

  if (value.includes("starter")) return "STARTER";
  if (value.includes("elite") || value.includes("agency") || value.includes("ultra")) return "ELITE";
  if (value.includes("pro") || value.includes("premium")) return "PRO";
  if (value.includes("free") || value.includes("basic")) return "FREE_BASIC";

  return "FREE_BASIC";
}

function applyMileageScoreModifier(score: number, mileage: number | null): number {
  if (mileage === null) return score;
  if (mileage < 100_000) return score + 5;
  if (mileage > 180_000) return score - 5;
  return score;
}

function isWithinAgeMinutes(createdAtMs: number, maxAgeMinutes: number, nowMs: number): boolean {
  const ageMs = nowMs - createdAtMs;
  if (!Number.isFinite(ageMs) || ageMs < 0) return false;
  return ageMs < maxAgeMinutes * 60_000;
}

/**
 * Tier-aware car alert eligibility (UI/alert alignment)
 *
 * IMPORTANT:
 * - Alerts are selective and never trigger scraping.
 * - Thresholds intentionally mirror the heat system:
 *   eligible deals are always at least "WARM" by score+freshness.
 *   This guarantees: if a user can receive an alert, the UI can show a heat indicator for that tier.
 */
export function getCarAlertEligibility(deal: CarDealAlertInput, userTier: unknown): boolean {
  return getCarAlertEligibilityWithRegion(deal, userTier, "US");
}

export function getCarAlertEligibilityWithRegion(
  deal: CarDealAlertInput,
  userTier: unknown,
  region: unknown
): boolean {
  const thresholds = getAlertThresholds(region, userTier, "car").alert;

  const scoreRaw = safeNumber(deal?.score);
  if (scoreRaw === null) return false;

  const mileage = safeNumber(deal?.mileage);
  const adjustedScore = applyMileageScoreModifier(scoreRaw, mileage);

  const createdAtMs =
    parseTimestampMs((deal as any)?.created_at) ??
    parseTimestampMs((deal as any)?.createdAt) ??
    null;
  if (createdAtMs === null) return false;

  const nowMs = Date.now();

  if (adjustedScore < thresholds.minScore) return false;
  if (!isWithinAgeMinutes(createdAtMs, thresholds.maxAgeMinutes, nowMs)) return false;

  return true;
}

export function shouldAlertCarDeal(input: CarAlertRuleInput): boolean {
  const dealScore = safeNumber(input.dealScore);
  if (dealScore === null || dealScore < 70) {
    // Optional tier gating (comment only):
    // Elite tier could allow dealScore >= 60.
    return false;
  }

  const minimumProfit = safeNumber(input.minEstimatedProfit) ?? 1000;
  const estimatedProfit = safeNumber(input.estimatedProfit);
  if (estimatedProfit === null || estimatedProfit < minimumProfit) return false;

  if (input.sellerType === "dealer") return false;

  const createdAtMs = parseTimestampMs(input.listingCreatedAt);
  if (createdAtMs === null) return false;

  const ageMs = safeNowMs(input.nowMs) - createdAtMs;
  const ageHours = ageMs / (60 * 60 * 1000);

  return ageHours >= 0 && ageHours < 48;
}
