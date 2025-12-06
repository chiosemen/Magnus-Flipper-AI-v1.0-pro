// apps/web/src/lib/shipping/labels.ts

/**
 * Shipping label wrapper
 * Wired up to @magnus-flipper-ai/shipping-engine package
 */

import { generateShippingLabel } from "@magnus-flipper-ai/shipping-engine/label/labelGenerator";
import type { ShippingRequest } from "@magnus-flipper-ai/shipping-engine/schemas/ShippingRequest";

export async function createShippingLabel(request: ShippingRequest) {
  try {
    return await generateShippingLabel(request);
  } catch (error) {
    console.error("Error generating shipping label:", error);
    throw error;
  }
}

