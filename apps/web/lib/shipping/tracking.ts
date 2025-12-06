// apps/web/src/lib/shipping/tracking.ts

/**
 * Shipping tracking wrapper
 * Wired up to @magnus-flipper-ai/shipping-engine package
 */

import { trackShipment } from "@magnus-flipper-ai/shipping-engine/tracking/trackingManager";

export async function trackShippingLabel(
  trackingNumber: string,
  carrier: string
) {
  try {
    return await trackShipment(trackingNumber, carrier);
  } catch (error) {
    console.error("Error tracking shipment:", error);
    throw error;
  }
}

