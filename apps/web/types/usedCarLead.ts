/**
 * Used Car Lead Types
 * 
 * Type definitions for used car lead capture and price estimation
 */

export type VehicleCondition = "excellent" | "good" | "fair" | "poor";

export interface UsedCarLeadPayload {
  // Vehicle identity
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: VehicleCondition;
  zip: string;

  // Pricing intelligence
  estimatedRetail: number;
  estimatedOfferLow: number;
  estimatedOfferHigh: number;

  // Client metadata
  source: "sell-used-car-page";
  sessionId?: string;
}

export interface UsedCarLeadResponse {
  success: true;
  leadId: string;
  estimatedOfferMid: number;
  priceDelta: number;
}

export interface UsedCarFormData {
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: VehicleCondition;
  zip: string;
}

/**
 * Validation helpers
 */
export function validateYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= 1990 && year <= currentYear + 1;
}

export function validateMileage(mileage: number): boolean {
  return mileage >= 0 && mileage <= 500_000;
}

export function validateZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export function validateOfferRange(
  estimatedRetail: number,
  estimatedOfferLow: number,
  estimatedOfferHigh: number
): boolean {
  return (
    estimatedOfferLow < estimatedOfferHigh &&
    estimatedRetail >= estimatedOfferHigh
  );
}

