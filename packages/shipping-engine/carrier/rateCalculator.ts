/**
 * Rate Calculator
 * Estimates shipping costs when carrier APIs are unavailable
 */

import type {
  ShippingRequest,
  CarrierRate,
  CarrierConfig,
} from "../schemas/ShippingRequest.js";

/**
 * Calculate estimated rate based on weight, distance, and service level
 * Fallback for when carrier API is offline or unavailable
 */
export async function calculateEstimatedRate(
  request: ShippingRequest,
  carrierConfig: CarrierConfig
): Promise<CarrierRate> {
  const weight = convertToOunces(
    request.dimensions.weight,
    request.dimensions.weightUnit
  );
  const isInternational = request.toAddress.country !== "US";

  // Get zone based on distance (simplified)
  const zone = calculateShippingZone(
    request.fromAddress.postalCode,
    request.toAddress.postalCode,
    isInternational
  );

  // Base rate calculation
  let baseRate = 0;

  switch (carrierConfig.carrier.toLowerCase()) {
    case "usps":
      baseRate = calculateUSPSEstimate(weight, zone, request.serviceLevel, isInternational);
      break;
    case "ups":
      baseRate = calculateUPSEstimate(weight, zone, request.serviceLevel, isInternational);
      break;
    case "fedex":
      baseRate = calculateFedExEstimate(weight, zone, request.serviceLevel, isInternational);
      break;
    default:
      baseRate = calculateGenericEstimate(weight, zone, request.serviceLevel, isInternational);
  }

  // Add insurance if requested
  if (request.insuranceValue) {
    baseRate += calculateInsuranceCost(request.insuranceValue);
  }

  // Add signature if requested
  if (request.requireSignature) {
    baseRate += 3.0;
  }

  // Add Saturday delivery if requested
  if (request.saturdayDelivery) {
    baseRate += 15.0;
  }

  // Estimate delivery days
  const estimatedDays = estimateDeliveryDays(
    zone,
    request.serviceLevel,
    isInternational
  );

  return {
    carrier: carrierConfig.carrier,
    service: getServiceName(carrierConfig.carrier, request.serviceLevel),
    rate: Math.round(baseRate * 100) / 100, // Round to 2 decimals
    currency: "USD",
    estimatedDays,
    metadata: {
      estimated: true,
      zone,
      weight,
    },
  };
}

/**
 * USPS rate estimation
 */
function calculateUSPSEstimate(
  weightOz: number,
  zone: number,
  serviceLevel: string,
  isInternational: boolean
): number {
  if (isInternational) {
    if (weightOz <= 16) {
      return 15 + zone * 2;
    } else if (weightOz <= 64) {
      return 35 + zone * 3;
    } else {
      return 65 + zone * 5;
    }
  }

  // Domestic USPS
  if (serviceLevel === "overnight") {
    return 25 + zone * 1.5;
  } else if (serviceLevel === "express") {
    if (weightOz <= 16) return 8.5 + zone * 0.5;
    if (weightOz <= 64) return 15 + zone * 1;
    return 25 + zone * 1.5;
  } else {
    // Standard
    if (weightOz <= 4) return 3.5;
    if (weightOz <= 16) return 4.5 + zone * 0.3;
    if (weightOz <= 64) return 8.5 + zone * 0.5;
    return 15 + zone * 1;
  }
}

/**
 * UPS rate estimation
 */
function calculateUPSEstimate(
  weightOz: number,
  zone: number,
  serviceLevel: string,
  isInternational: boolean
): number {
  const weightLb = weightOz / 16;

  if (isInternational) {
    return 45 + weightLb * 5 + zone * 5;
  }

  // Domestic UPS
  if (serviceLevel === "overnight") {
    return 35 + weightLb * 2 + zone * 2;
  } else if (serviceLevel === "express") {
    return 18 + weightLb * 1.5 + zone * 1.5;
  } else {
    return 10 + weightLb * 1 + zone * 1;
  }
}

/**
 * FedEx rate estimation
 */
function calculateFedExEstimate(
  weightOz: number,
  zone: number,
  serviceLevel: string,
  isInternational: boolean
): number {
  const weightLb = weightOz / 16;

  if (isInternational) {
    return 50 + weightLb * 6 + zone * 6;
  }

  // Domestic FedEx
  if (serviceLevel === "overnight") {
    return 40 + weightLb * 2.5 + zone * 2;
  } else if (serviceLevel === "express") {
    return 20 + weightLb * 1.5 + zone * 1.5;
  } else {
    return 12 + weightLb * 1.2 + zone * 1;
  }
}

/**
 * Generic carrier estimate
 */
function calculateGenericEstimate(
  weightOz: number,
  zone: number,
  serviceLevel: string,
  isInternational: boolean
): number {
  const weightLb = weightOz / 16;

  if (isInternational) {
    return 40 + weightLb * 5 + zone * 5;
  }

  if (serviceLevel === "overnight") {
    return 30 + weightLb * 2 + zone * 2;
  } else if (serviceLevel === "express") {
    return 15 + weightLb * 1.5 + zone * 1.5;
  } else {
    return 8 + weightLb * 1 + zone * 1;
  }
}

/**
 * Calculate shipping zone based on postal codes
 * Simplified version - in production, use actual zone lookup tables
 */
function calculateShippingZone(
  fromZip: string,
  toZip: string,
  isInternational: boolean
): number {
  if (isInternational) {
    return 8; // International zone
  }

  // Extract first 3 digits of ZIP codes
  const fromPrefix = parseInt(fromZip.substring(0, 3));
  const toPrefix = parseInt(toZip.substring(0, 3));

  // Calculate approximate distance zone (1-8)
  const difference = Math.abs(fromPrefix - toPrefix);

  if (difference <= 50) return 1;
  if (difference <= 150) return 2;
  if (difference <= 300) return 3;
  if (difference <= 600) return 4;
  if (difference <= 1000) return 5;
  if (difference <= 1400) return 6;
  if (difference <= 1800) return 7;
  return 8;
}

/**
 * Estimate delivery days
 */
function estimateDeliveryDays(
  zone: number,
  serviceLevel: string,
  isInternational: boolean
): number {
  if (isInternational) {
    if (serviceLevel === "overnight") return 3;
    if (serviceLevel === "express") return 7;
    return 14;
  }

  if (serviceLevel === "overnight") return 1;
  if (serviceLevel === "express") {
    if (zone <= 3) return 2;
    if (zone <= 5) return 3;
    return 4;
  }

  // Standard
  if (zone <= 3) return 3;
  if (zone <= 5) return 5;
  return 7;
}

/**
 * Calculate insurance cost
 */
function calculateInsuranceCost(insuranceValue: number): number {
  // Typically $1-2 per $100 of coverage
  return Math.ceil(insuranceValue / 100) * 1.5;
}

/**
 * Get service name based on carrier and service level
 */
function getServiceName(carrier: string, serviceLevel: string): string {
  const serviceMap: Record<string, Record<string, string>> = {
    usps: {
      standard: "USPS Priority Mail",
      express: "USPS Priority Mail Express",
      overnight: "USPS Priority Mail Express",
      international: "USPS Priority Mail International",
    },
    ups: {
      standard: "UPS Ground",
      express: "UPS 2nd Day Air",
      overnight: "UPS Next Day Air",
      international: "UPS Worldwide Express",
    },
    fedex: {
      standard: "FedEx Ground",
      express: "FedEx 2Day",
      overnight: "FedEx Priority Overnight",
      international: "FedEx International Priority",
    },
  };

  return (
    serviceMap[carrier.toLowerCase()]?.[serviceLevel] ||
    `${carrier} ${serviceLevel}`
  );
}

/**
 * Convert weight to ounces
 */
function convertToOunces(weight: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case "oz":
      return weight;
    case "lb":
      return weight * 16;
    case "g":
      return weight * 0.035274;
    case "kg":
      return weight * 35.274;
    default:
      return weight;
  }
}

/**
 * Calculate dimensional weight (for large, light packages)
 */
export function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number,
  unit: string = "in"
): number {
  // Convert to inches if needed
  let l = length,
    w = width,
    h = height;
  if (unit === "cm") {
    l = length / 2.54;
    w = width / 2.54;
    h = height / 2.54;
  }

  // Dimensional weight formula: (L x W x H) / 139 for domestic
  const dimWeight = (l * w * h) / 139;
  return Math.ceil(dimWeight * 16); // Convert to ounces
}

/**
 * Get billable weight (greater of actual or dimensional weight)
 */
export function getBillableWeight(
  actualWeight: number,
  dimensions: { length: number; width: number; height: number },
  weightUnit: string = "oz",
  dimensionUnit: string = "in"
): number {
  const actualWeightOz = convertToOunces(actualWeight, weightUnit);
  const dimWeightOz = calculateDimensionalWeight(
    dimensions.length,
    dimensions.width,
    dimensions.height,
    dimensionUnit
  );

  return Math.max(actualWeightOz, dimWeightOz);
}
