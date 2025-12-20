export type CarSellerType = "dealer" | "private" | "unknown";

export type CarDealScoringInput = {
  askingPrice?: number | null;
  estimatedResale?: number | null;
  year?: number | null;
  mileage?: number | null;
  make?: string | null;
  model?: string | null;
  descriptionText?: string | null;
  sellerType?: CarSellerType | null;
  motStatus?: string | null;
  transmission?: string | null;
  location?: string | null;
};

export type CarDealScoreBreakdown = {
  BaseMarginScore: number;
  DemandScore: number;
  ConditionMismatchScore: number;
  RepairRiskPenalty: number;
  LiquidityPenalty: number;
  sellerPenaltyApplied: number;
  DealScore: number;
  Interpretation: "Strong Flip" | "Worth Inspecting" | "Speculative" | "Avoid";
};

export type CarDealScoreResult = {
  dealScore: number;
  breakdown: CarDealScoreBreakdown;
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function computeBaseMarginScore(askingPrice: number | null, estimatedResale: number | null): number {
  if (!askingPrice || !estimatedResale) return 0;
  if (askingPrice <= 0 || estimatedResale <= 0) return 0;

  const profit = estimatedResale - askingPrice;
  if (profit <= 0) return 0;

  const profitAbsScore = clamp((profit / 3000) * 20, 0, 20);
  const profitPct = profit / askingPrice;
  const profitPctScore = clamp((profitPct / 0.25) * 20, 0, 20);

  return clamp(profitAbsScore + profitPctScore, 0, 40);
}

function computeDemandScore(makeRaw: string, modelRaw: string, year: number | null, descriptionText: string): number {
  const make = normalizeText(makeRaw);
  const model = normalizeText(modelRaw);
  const description = normalizeText(descriptionText);

  const highDemandMakes = new Set([
    "toyota",
    "honda",
    "volkswagen",
    "vw",
    "ford",
    "bmw",
    "audi",
    "mercedes",
    "mercedes-benz",
    "nissan",
    "hyundai",
    "kia",
  ]);

  const highDemandModels = [
    "golf",
    "polo",
    "focus",
    "fiesta",
    "civic",
    "corolla",
    "yaris",
    "qashqai",
    "a3",
    "a4",
    "3 series",
    "c class",
    "e class",
    "sportage",
    "tucson",
  ];

  let score = 0;

  if (make && highDemandMakes.has(make)) score += 8;

  const modelHaystack = `${make} ${model} ${description}`;
  if (highDemandModels.some((m) => modelHaystack.includes(m))) score += 8;

  if (typeof year === "number" && Number.isFinite(year)) {
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - year);
    if (age <= 2) score += 4;
    else if (age <= 6) score += 3;
    else if (age <= 10) score += 2;
    else if (age <= 15) score += 1;
  }

  return clamp(score, 0, 20);
}

function computeConditionMismatchScore(year: number | null, mileage: number | null, descriptionText: string): number {
  const description = normalizeText(descriptionText);
  const hasServiceHistory =
    description.includes("full service history") ||
    description.includes("service history") ||
    description.includes("fsh");

  if (!year || !mileage || year <= 0 || mileage < 0) {
    // Unknown info: treat as neutral rather than punitive.
    return hasServiceHistory ? 12 : 10;
  }

  const currentYear = new Date().getFullYear();
  const ageYears = Math.max(1, currentYear - year);
  const milesPerYear = mileage / ageYears;

  let mismatchPenalty = 0;
  if (milesPerYear > 20000) mismatchPenalty = 20;
  else if (milesPerYear > 16000) mismatchPenalty = 15;
  else if (milesPerYear > 13000) mismatchPenalty = 10;
  else if (milesPerYear > 11000) mismatchPenalty = 6;
  else if (milesPerYear > 9000) mismatchPenalty = 3;

  const base = clamp(20 - mismatchPenalty, 0, 20);
  const bonus = hasServiceHistory ? 2 : 0;
  return clamp(base + bonus, 0, 20);
}

function computeRepairRiskPenalty(
  year: number | null,
  mileage: number | null,
  descriptionText: string,
  motStatusRaw: string,
  transmissionRaw: string
): number {
  const description = normalizeText(descriptionText);
  const motStatus = normalizeText(motStatusRaw);
  const transmission = normalizeText(transmissionRaw);

  if (description.includes("spares or repair") || description.includes("spares & repairs") || description.includes("non runner") || description.includes("not running")) {
    return 20;
  }

  let penalty = 0;

  // Uncertainty penalty: missing description often hides issues.
  if (description.length === 0) penalty += 3;

  if (motStatus.includes("expired") || motStatus.includes("no mot") || motStatus.includes("fail")) penalty += 10;
  else if (motStatus.includes("advis")) penalty += 4;

  const majorIssues = [
    "engine",
    "gearbox",
    "clutch",
    "head gasket",
    "timing belt",
    "timing chain",
    "turbo",
    "dpf",
    "eml",
    "engine light",
    "warning light",
    "oil leak",
    "overheat",
    "misfire",
  ];
  if (majorIssues.some((t) => description.includes(t))) penalty += 8;

  const accidentMarkers = ["cat s", "cat n", "write off", "write-off", "salvage"];
  if (accidentMarkers.some((t) => description.includes(t))) penalty += 8;

  const cosmeticIssues = ["dent", "scratch", "scuff", "paint", "bumper", "alloy"];
  if (cosmeticIssues.some((t) => description.includes(t))) penalty += 3;

  if (typeof year === "number" && Number.isFinite(year) && year > 0) {
    if (year < 2008) penalty += 3;
    else if (year < 2012) penalty += 2;
  }

  if (typeof mileage === "number" && Number.isFinite(mileage) && mileage > 0) {
    if (mileage > 200000) penalty += 6;
    else if (mileage > 150000) penalty += 4;
  }

  if (transmission.includes("semi-auto") || transmission.includes("semi automatic")) penalty += 2;

  return clamp(penalty, 0, 20);
}

function sellerPenaltyFromType(sellerType: CarSellerType | null | undefined): number {
  if (sellerType === "dealer") return -5;
  if (sellerType === "unknown" || !sellerType) return -2;
  return 0;
}

function interpretDealScore(score: number): CarDealScoreBreakdown["Interpretation"] {
  if (score >= 80) return "Strong Flip";
  if (score >= 65) return "Worth Inspecting";
  if (score >= 50) return "Speculative";
  return "Avoid";
}

export function scoreCarDeal(input: CarDealScoringInput): CarDealScoreResult {
  const askingPrice = safeNumber(input.askingPrice);
  const estimatedResale = safeNumber(input.estimatedResale);
  const year = safeNumber(input.year);
  const mileage = safeNumber(input.mileage);
  const make = typeof input.make === "string" ? input.make : "";
  const model = typeof input.model === "string" ? input.model : "";
  const descriptionText = typeof input.descriptionText === "string" ? input.descriptionText : "";
  const motStatus = typeof input.motStatus === "string" ? input.motStatus : "";
  const transmission = typeof input.transmission === "string" ? input.transmission : "";

  const BaseMarginScore = computeBaseMarginScore(askingPrice, estimatedResale);
  const DemandScore = computeDemandScore(make, model, year, descriptionText);
  const ConditionMismatchScore = computeConditionMismatchScore(year, mileage, descriptionText);
  const RepairRiskPenalty = computeRepairRiskPenalty(
    year,
    mileage,
    descriptionText,
    motStatus,
    transmission
  );

  const sellerPenaltyApplied = sellerPenaltyFromType(input.sellerType);
  const LiquidityPenalty = clamp(10 + sellerPenaltyApplied, 0, 10);

  // Convert penalties into bounded "remaining score" buckets (0-20 and 0-10).
  const repairScore = clamp(20 - RepairRiskPenalty, 0, 20);

  const raw = BaseMarginScore + DemandScore + ConditionMismatchScore + repairScore + LiquidityPenalty;
  const DealScore = clamp(raw, 0, 100);
  const Interpretation = interpretDealScore(DealScore);

  return {
    dealScore: DealScore,
    breakdown: {
      BaseMarginScore,
      DemandScore,
      ConditionMismatchScore,
      RepairRiskPenalty,
      LiquidityPenalty,
      sellerPenaltyApplied,
      DealScore,
      Interpretation,
    },
  };
}
