/**
 * Generic Carrier Client
 * Fallback for future carrier integrations
 */

import type {
  ShippingRequest,
  CarrierRate,
  CarrierConfig,
  ShippingLabel,
} from "../schemas/ShippingRequest.js";
import { calculateEstimatedRate } from "./rateCalculator.js";

/**
 * Get rates from generic carrier
 * Uses estimation algorithm
 */
export async function getRatesFromGenericCarrier(
  request: ShippingRequest,
  config: CarrierConfig
): Promise<CarrierRate[]> {
  return [await calculateEstimatedRate(request, config)];
}

/**
 * Generate label from generic carrier
 * Returns mock label
 */
export async function generateGenericLabel(
  request: ShippingRequest,
  selectedRate: CarrierRate,
  config: CarrierConfig
): Promise<Partial<ShippingLabel>> {
  const trackingNumber = `GEN${Date.now()}${Math.floor(Math.random() * 1000)}`;

  return {
    carrier: config.carrier,
    service: selectedRate.service,
    trackingNumber,
    trackingUrl: `https://track.example.com/${trackingNumber}`,
    labelFormat: "pdf",
    shippingCost: selectedRate.rate,
    totalCost: selectedRate.rate,
    rawResponse: { mock: true, generic: true },
  };
}
