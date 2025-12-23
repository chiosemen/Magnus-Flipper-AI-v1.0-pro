/**
 * Used Car Lead Types
 */

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
