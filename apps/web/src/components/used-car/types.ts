/**
 * Used Car Component Types
 */

import type { UsedCarFormData, VehicleCondition } from "@/types/usedCarLead";

export interface PriceEstimate {
  estimatedRetail: number;
  estimatedOfferLow: number;
  estimatedOfferHigh: number;
  estimatedOfferMid: number;
  priceDelta: number;
}

export interface PriceEstimatorProps {
  formData: UsedCarFormData | null;
}

export interface UsedCarFormProps {
  onEstimate: (data: UsedCarFormData) => void;
  onSubmit: (data: UsedCarFormData, estimate: PriceEstimate) => Promise<void>;
  isSubmitting?: boolean;
}

