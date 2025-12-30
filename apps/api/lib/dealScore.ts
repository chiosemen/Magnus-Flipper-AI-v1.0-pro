export type Listing = {
  id?: string;
  market: string;
  query: string;
  title: string;
  price: number | string | null;
  currency?: string;
  url?: string;
  image?: string;
  locationText?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  postedAt?: string;
  fetchedAt: string;
  raw?: any;
};

export type DealScoreComponents = {
  priceDeviation: number;
  marketVelocity: number;
  geoScarcity: number;
  resaleSpread: number;
  dataQuality: number;
};

export type DealSignals = {
  priceDelta: number | null;
  marketMedianDelta: number | null;
  freshness: number;
  geoConfidence: number;
  liquidity: number;
};

export type DealScoreResult = {
  score: number;
  confidence: "low" | "medium" | "high";
  components: DealScoreComponents;
  explanation: string[];
  warnings: string[];
  debug?: Record<string, any>;
};

export type DealScore = {
  score: number;
  confidence: "low" | "medium" | "high";
  signals: DealSignals;
  explanation: string[];
  debug?: Record<string, any>;
  context?: {
    marketMedian?: number | null;
    listingCount?: number | null;
  };
};

export type DealScoreContext = {
  medianPrice?: number | null;
  countListings?: number | null;
  resaleAnchor?: number | null;
  now?: Date;
  debug?: boolean;
};

export type ScoreDealInput = {
  listing: Listing;
  marketContext?: {
    medianPrice?: number | null;
    listingCount?: number | null;
    referencePrice?: number | null;
  };
  geoContext?: {
    hasExactLocation?: boolean;
    hasRadius?: boolean;
    isInferred?: boolean;
  };
  historicalStats?: {
    marketMedian?: number | null;
    listingCount?: number | null;
  };
  debug?: boolean;
};

export interface DealScorer {
  score(input: ScoreDealInput): DealScore;
}

const PRICE_KEYS = [
  "price",
  "priceLabel",
  "listingPrice",
  "priceValue",
  "amount",
  "value",
];

const RESALE_ANCHOR_KEYS = [
  "resalePrice",
  "resale_price",
  "tradeValue",
  "trade_value",
  "tradeInValue",
  "trade_in_value",
  "sellPrice",
  "soldPrice",
  "sold_price",
  "amazonPrice",
  "amazon_price",
  "cexTrade",
  "cex_trade",
  "marketPrice",
  "market_price",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function parsePriceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if (!cleaned) return null;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function extractResaleAnchor(item: any): number | null {
  if (!item || typeof item !== "object") return null;
  for (const key of RESALE_ANCHOR_KEYS) {
    const value = item[key];
    const parsed = parsePriceNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

export function extractPrice(item: any): number | null {
  if (!item || typeof item !== "object") return null;
  for (const key of PRICE_KEYS) {
    const value = item[key];
    const parsed = parsePriceNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function scorePriceDeviation(price: number | null, medianPrice: number | null, warnings: string[]) {
  if (price === null || medianPrice === null || medianPrice <= 0) {
    warnings.push("Median price unavailable; price deviation neutral.");
    return 20;
  }
  const delta = (medianPrice - price) / medianPrice;
  const normalized = clamp((delta + 0.05) / 0.6, 0, 1);
  return Math.round(normalized * 40);
}

function scoreMarketVelocity(
  postedAt: string | undefined,
  fetchedAt: string,
  countListings: number | null,
  warnings: string[],
) {
  const now = Date.now();
  const postedMs = postedAt ? Date.parse(postedAt) : NaN;
  const fetchedMs = Date.parse(fetchedAt);
  const referenceMs = Number.isFinite(postedMs) ? postedMs : fetchedMs;
  let freshnessScore = 0.5;

  if (Number.isFinite(referenceMs)) {
    const ageHours = (now - referenceMs) / 3600000;
    if (ageHours <= 6) freshnessScore = 1;
    else if (ageHours <= 24) freshnessScore = 0.7;
    else if (ageHours <= 72) freshnessScore = 0.45;
    else freshnessScore = 0.2;
  } else {
    warnings.push("Freshness data missing; velocity neutral.");
  }

  let volumeScore = 0.5;
  if (typeof countListings === "number") {
    if (countListings >= 100) volumeScore = 1;
    else if (countListings >= 30) volumeScore = 0.8;
    else if (countListings >= 10) volumeScore = 0.6;
    else if (countListings >= 5) volumeScore = 0.4;
    else volumeScore = 0.2;
  } else {
    warnings.push("Market volume unavailable; velocity neutral.");
  }

  return Math.round(((freshnessScore + volumeScore) / 2) * 20);
}

function scoreGeoScarcity(
  hasGeo: boolean,
  countListings: number | null,
  warnings: string[],
) {
  if (!hasGeo || typeof countListings !== "number") {
    warnings.push("Geo scarcity unavailable; neutral score.");
    return 7;
  }
  if (countListings <= 5) return 15;
  if (countListings <= 15) return 12;
  if (countListings <= 50) return 8;
  if (countListings <= 100) return 5;
  return 3;
}

function scoreResaleSpread(
  price: number | null,
  resaleAnchor: number | null,
  warnings: string[],
) {
  if (price === null || resaleAnchor === null || resaleAnchor <= 0) {
    warnings.push("No resale anchor; spread neutral.");
    return 8;
  }
  const spread = (resaleAnchor - price) / resaleAnchor;
  const normalized = clamp((spread + 0.05) / 0.6, 0, 1);
  return Math.round(normalized * 20);
}

function scoreDataQuality(listing: Listing) {
  let score = 5;
  const title = listing.title?.trim() ?? "";
  if (!title || title.length < 3) score -= 1;
  const price = parsePriceNumber(listing.price);
  if (price === null) score -= 2;
  if (!listing.url) score -= 1;
  return clamp(score, 0, 5);
}

export function scoreListing(
  listing: Listing,
  context: DealScoreContext = {},
): DealScoreResult {
  const warnings: string[] = [];
  const explanation: string[] = [];
  const price = parsePriceNumber(listing.price);
  const medianPrice = context.medianPrice ?? null;
  const countListings = context.countListings ?? null;
  const resaleAnchor = context.resaleAnchor ?? null;
  const dataQuality = scoreDataQuality(listing);

  const priceDeviation = scorePriceDeviation(price, medianPrice, warnings);
  if (price !== null && medianPrice !== null && medianPrice > 0) {
    const discount = ((medianPrice - price) / medianPrice) * 100;
    if (discount > 10) {
      explanation.push(`Price ${discount.toFixed(0)}% below median.`);
    } else if (discount < -10) {
      explanation.push(`Price above median by ${Math.abs(discount).toFixed(0)}%.`);
    }
  }

  const marketVelocity = scoreMarketVelocity(
    listing.postedAt,
    listing.fetchedAt,
    countListings,
    warnings,
  );
  if (marketVelocity >= 14) {
    explanation.push("Fresh listing in an active market.");
  }

  const hasGeo =
    typeof listing.lat === "number" &&
    typeof listing.lng === "number";
  const geoScarcity = scoreGeoScarcity(hasGeo, countListings, warnings);
  if (geoScarcity >= 12) {
    explanation.push("Limited local supply in the radius.");
  }

  const resaleSpread = scoreResaleSpread(price, resaleAnchor, warnings);
  if (resaleSpread >= 12) {
    explanation.push("Resale anchor suggests a healthy spread.");
  }

  if (dataQuality <= 3) {
    explanation.push("Limited listing details reduce confidence.");
  }

  const score = clamp(
    priceDeviation + marketVelocity + geoScarcity + resaleSpread + dataQuality,
    0,
    100,
  );

  let confidence: "low" | "medium" | "high" = "low";
  if (price !== null && (medianPrice !== null || resaleAnchor !== null) && hasGeo) {
    confidence = "high";
  } else if (price !== null && (medianPrice !== null || resaleAnchor !== null)) {
    confidence = "medium";
  }

  const result: DealScoreResult = {
    score,
    confidence,
    components: {
      priceDeviation,
      marketVelocity,
      geoScarcity,
      resaleSpread,
      dataQuality,
    },
    explanation,
    warnings,
  };

  if (context.debug) {
    result.debug = {
      price,
      medianPrice,
      countListings,
      resaleAnchor,
      fetchedAt: listing.fetchedAt,
    };
  }

  return result;
}

function normalizeFreshness(postedAt: string | undefined, fetchedAt: string): number {
  const now = Date.now();
  const postedMs = postedAt ? Date.parse(postedAt) : NaN;
  const fetchedMs = Date.parse(fetchedAt);
  const referenceMs = Number.isFinite(postedMs) ? postedMs : fetchedMs;
  if (!Number.isFinite(referenceMs)) return 0.5;
  const ageHours = (now - referenceMs) / 3600000;
  if (ageHours <= 6) return 1;
  if (ageHours <= 24) return 0.7;
  if (ageHours <= 72) return 0.45;
  return 0.2;
}

function normalizeLiquidity(count: number | null): number {
  if (count === null) return 0.5;
  if (count >= 100) return 1;
  if (count >= 30) return 0.8;
  if (count >= 10) return 0.6;
  if (count >= 5) return 0.4;
  return 0.2;
}

function normalizeGeoConfidence(
  geoContext?: ScoreDealInput["geoContext"],
  listing?: Listing,
): number {
  if (geoContext?.hasExactLocation) return 1;
  if (geoContext?.isInferred) return 0.6;
  if (geoContext?.hasRadius) return 0.5;
  if (listing?.lat && listing?.lng) return 0.7;
  return 0.3;
}

function buildExplanation(signals: DealSignals): string[] {
  const lines: string[] = [];
  if (signals.marketMedianDelta !== null) {
    const percent = Math.round(signals.marketMedianDelta * 100);
    if (percent >= 5) {
      lines.push(`Priced ${percent}% below recent market median.`);
    } else if (percent <= -5) {
      lines.push(`Priced ${Math.abs(percent)}% above market median.`);
    }
  }
  if (signals.freshness >= 0.7) {
    lines.push('Listed recently.');
  }
  if (signals.geoConfidence >= 0.8) {
    lines.push('Location matches the requested area.');
  } else if (signals.geoConfidence <= 0.4) {
    lines.push('Location precision is limited for this market.');
  }
  if (signals.liquidity >= 0.7) {
    lines.push('High demand in this area.');
  }
  return lines;
}

export function scoreDeal(input: ScoreDealInput): DealScore {
  const price = parsePriceNumber(input.listing.price);
  const medianPrice =
    input.marketContext?.medianPrice ??
    input.historicalStats?.marketMedian ??
    null;
  const listingCount =
    input.marketContext?.listingCount ??
    input.historicalStats?.listingCount ??
    null;
  const referencePrice = input.marketContext?.referencePrice ?? null;
  const warnings: string[] = [];
  const hasGeo =
    Boolean(input.geoContext?.hasExactLocation) ||
    Boolean(input.geoContext?.hasRadius) ||
    (typeof input.listing.lat === "number" &&
      typeof input.listing.lng === "number");

  const priceDelta =
    price !== null && referencePrice !== null && referencePrice > 0
      ? (referencePrice - price) / referencePrice
      : null;
  const marketMedianDelta =
    price !== null && medianPrice !== null && medianPrice > 0
      ? (medianPrice - price) / medianPrice
      : null;

  const freshness = normalizeFreshness(
    input.listing.postedAt,
    input.listing.fetchedAt,
  );
  const geoConfidence = normalizeGeoConfidence(input.geoContext, input.listing);
  const liquidity = normalizeLiquidity(listingCount);

  const signals: DealSignals = {
    priceDelta,
    marketMedianDelta,
    freshness,
    geoConfidence,
    liquidity,
  };

  const priceDeviation = scorePriceDeviation(price, medianPrice, warnings);
  const marketVelocity = scoreMarketVelocity(
    input.listing.postedAt,
    input.listing.fetchedAt,
    listingCount,
    warnings,
  );
  const geoScarcity = scoreGeoScarcity(hasGeo, listingCount, warnings);
  const resaleSpread = scoreResaleSpread(price, referencePrice, warnings);
  const dataQuality = scoreDataQuality(input.listing);

  const score = Math.round(
    clamp(
      priceDeviation + marketVelocity + geoScarcity + resaleSpread + dataQuality,
      0,
      100,
    ),
  );

  let confidence: DealScore["confidence"] = "low";
  if (price !== null && (medianPrice !== null || referencePrice !== null) && hasGeo) {
    confidence = "high";
  } else if (price !== null && (medianPrice !== null || referencePrice !== null)) {
    confidence = "medium";
  }

  const explanation = buildExplanation(signals);

  const result: DealScore = {
    score,
    confidence,
    signals,
    explanation,
    context: {
      marketMedian: medianPrice,
      listingCount,
    },
  };

  if (input.debug) {
    result.debug = {
      price,
      medianPrice,
      listingCount,
      referencePrice,
      warnings,
    };
  }

  return result;
}

export const dealScoreV1: DealScorer = {
  score: scoreDeal,
};
