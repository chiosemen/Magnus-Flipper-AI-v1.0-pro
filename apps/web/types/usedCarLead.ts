/**
 * Used Car Lead Types
 */

export type VehicleCondition = "excellent" | "good" | "fair" | "poor" | "salvage";

export interface UsedCarFormData {
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: VehicleCondition;
  zip: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface UsedCarLeadPayload {
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: string;
  zip: string;
  estimatedRetail: number;
  estimatedOfferLow: number;
  estimatedOfferHigh: number;
  source?: string;
}

export interface UsedCarLeadResponse {
  status: string;
  message?: string;
  leadId?: string;
}
