/**
 * Carrier Selection Engine
 * Automatically chooses the best shipping carrier based on multiple factors
 */

import type {
  ShippingRequest,
  CarrierRate,
  CarrierConfig,
} from "../schemas/ShippingRequest.js";
import { getRatesFromUSPS } from "./carrierClient_USPS.js";
import { getRatesFromUPS } from "./carrierClient_UPS.js";
import { getRatesFromFedEx } from "./carrierClient_FedEx.js";
import { calculateEstimatedRate } from "./rateCalculator.js";

export interface CarrierSelectionResult {
  selectedCarrier: string;
  selectedService: string;
  selectedRate: CarrierRate;
  allRates: CarrierRate[];
  selectionReason: string;
}

/**
 * Select the best carrier for a shipping request
 * Considers: price, speed, reliability, marketplace constraints
 */
export async function selectCarrier(
  request: ShippingRequest,
  carrierConfigs: CarrierConfig[]
): Promise<CarrierSelectionResult> {
  // Get rates from all enabled carriers
  const allRates = await fetchAllCarrierRates(request, carrierConfigs);

  if (allRates.length === 0) {
    throw new Error("No carrier rates available for this shipment");
  }

  // Apply marketplace constraints first
  let eligibleRates = applyMarketplaceConstraints(
    allRates,
    request.marketplaceRequirements
  );

  if (eligibleRates.length === 0) {
    eligibleRates = allRates; // Fallback if constraints eliminate all options
  }

  // Apply carrier preference if specified
  if (request.carrierPreference !== "auto") {
    const preferredRates = eligibleRates.filter(
      (rate) => rate.carrier.toLowerCase() === request.carrierPreference.toLowerCase()
    );
    if (preferredRates.length > 0) {
      eligibleRates = preferredRates;
    }
  }

  // Score each rate based on multiple factors
  const scoredRates = eligibleRates.map((rate) => ({
    rate,
    score: scoreCarrierRate(rate, request),
  }));

  // Sort by score (highest first)
  scoredRates.sort((a, b) => b.score - a.score);

  const selectedRate = scoredRates[0].rate;

  return {
    selectedCarrier: selectedRate.carrier,
    selectedService: selectedRate.service,
    selectedRate,
    allRates,
    selectionReason: explainSelection(selectedRate, scoredRates, request),
  };
}

/**
 * Fetch rates from all enabled carriers in parallel
 */
async function fetchAllCarrierRates(
  request: ShippingRequest,
  carrierConfigs: CarrierConfig[]
): Promise<CarrierRate[]> {
  const enabledCarriers = carrierConfigs.filter((c) => c.enabled);

  const ratePromises = enabledCarriers.map(async (config) => {
    try {
      switch (config.carrier.toLowerCase()) {
        case "usps":
          return await getRatesFromUSPS(request, config);
        case "ups":
          return await getRatesFromUPS(request, config);
        case "fedex":
          return await getRatesFromFedEx(request, config);
        default:
          // Fallback to estimated rates
          return [await calculateEstimatedRate(request, config)];
      }
    } catch (error) {
      console.error(`Failed to get rates from ${config.carrier}:`, error);
      return [];
    }
  });

  const results = await Promise.all(ratePromises);
  return results.flat();
}

/**
 * Apply marketplace-specific constraints
 */
function applyMarketplaceConstraints(
  rates: CarrierRate[],
  constraints?: ShippingRequest["marketplaceRequirements"]
): CarrierRate[] {
  if (!constraints) return rates;

  let filtered = rates;

  // Filter by max delivery days
  if (constraints.maxDeliveryDays) {
    filtered = filtered.filter(
      (rate) => rate.estimatedDays <= constraints.maxDeliveryDays!
    );
  }

  // Filter by required carrier
  if (constraints.requiredCarrier) {
    filtered = filtered.filter(
      (rate) => rate.carrier.toLowerCase() === constraints.requiredCarrier!.toLowerCase()
    );
  }

  // Ensure tracking if required
  if (constraints.trackingRequired) {
    // All major carriers provide tracking, but filter out any that don't
    filtered = filtered.filter((rate) => rate.metadata?.trackingIncluded !== false);
  }

  return filtered;
}

/**
 * Score a carrier rate based on multiple factors
 * Higher score = better option
 */
function scoreCarrierRate(rate: CarrierRate, request: ShippingRequest): number {
  let score = 0;

  // Price factor (inverse - lower price = higher score)
  const priceScore = 100 / (1 + rate.rate / 10); // Normalize price impact
  score += priceScore * 0.5; // 50% weight on price

  // Speed factor
  const speedScore = 100 / (1 + rate.estimatedDays / 2); // Faster = better
  const speedWeight = request.serviceLevel === "express" ? 0.4 : 0.2;
  score += speedScore * speedWeight;

  // Reliability factor (carrier-specific)
  const reliabilityScore = getCarrierReliability(rate.carrier);
  score += reliabilityScore * 0.2; // 20% weight on reliability

  // Marketplace preference bonus
  if (isPreferredByMarketplace(rate.carrier, request.marketplace)) {
    score += 10;
  }

  // Domestic vs international
  if (request.toAddress.country !== "US") {
    // Boost carriers with better international service
    if (["fedex", "dhl", "ups"].includes(rate.carrier.toLowerCase())) {
      score += 15;
    }
  }

  return score;
}

/**
 * Get carrier reliability score (0-100)
 * Based on historical performance
 */
function getCarrierReliability(carrier: string): number {
  const reliabilityMap: Record<string, number> = {
    usps: 85,
    ups: 90,
    fedex: 92,
    dhl: 88,
    royal_mail: 82,
  };

  return reliabilityMap[carrier.toLowerCase()] || 75;
}

/**
 * Check if carrier is preferred by marketplace
 */
function isPreferredByMarketplace(carrier: string, marketplace: string): boolean {
  const preferences: Record<string, string[]> = {
    ebay: ["usps", "ups", "fedex"],
    vinted: ["usps", "royal_mail"],
    depop: ["usps", "ups"],
    poshmark: ["usps"],
    facebook: ["usps", "ups"],
    offerup: ["usps"],
  };

  const preferredCarriers = preferences[marketplace.toLowerCase()] || [];
  return preferredCarriers.includes(carrier.toLowerCase());
}

/**
 * Generate human-readable explanation for carrier selection
 */
function explainSelection(
  selectedRate: CarrierRate,
  scoredRates: Array<{ rate: CarrierRate; score: number }>,
  request: ShippingRequest
): string {
  const reasons: string[] = [];

  // Price comparison
  const cheapestRate = scoredRates.reduce((min, r) =>
    r.rate.rate < min.rate.rate ? r : min
  );
  if (selectedRate === cheapestRate.rate) {
    reasons.push("lowest cost");
  }

  // Speed comparison
  const fastestRate = scoredRates.reduce((min, r) =>
    r.rate.estimatedDays < min.rate.estimatedDays ? r : min
  );
  if (selectedRate === fastestRate.rate) {
    reasons.push("fastest delivery");
  }

  // Marketplace preference
  if (isPreferredByMarketplace(selectedRate.carrier, request.marketplace)) {
    reasons.push(`preferred by ${request.marketplace}`);
  }

  // Service level match
  if (request.serviceLevel === "express" && selectedRate.estimatedDays <= 2) {
    reasons.push("meets express delivery requirement");
  }

  // Carrier preference
  if (request.carrierPreference !== "auto") {
    reasons.push("matches carrier preference");
  }

  if (reasons.length === 0) {
    reasons.push("best overall value");
  }

  return `Selected due to: ${reasons.join(", ")}`;
}

/**
 * Get cheapest rate (for comparison purposes)
 */
export function getCheapestRate(rates: CarrierRate[]): CarrierRate | null {
  if (rates.length === 0) return null;
  return rates.reduce((min, rate) => (rate.rate < min.rate ? rate : min));
}

/**
 * Get fastest rate (for comparison purposes)
 */
export function getFastestRate(rates: CarrierRate[]): CarrierRate | null {
  if (rates.length === 0) return null;
  return rates.reduce((min, rate) =>
    rate.estimatedDays < min.estimatedDays ? rate : min
  );
}

/**
 * Filter rates by max price
 */
export function filterRatesByPrice(
  rates: CarrierRate[],
  maxPrice: number
): CarrierRate[] {
  return rates.filter((rate) => rate.rate <= maxPrice);
}

/**
 * Filter rates by max delivery days
 */
export function filterRatesBySpeed(
  rates: CarrierRate[],
  maxDays: number
): CarrierRate[] {
  return rates.filter((rate) => rate.estimatedDays <= maxDays);
}
