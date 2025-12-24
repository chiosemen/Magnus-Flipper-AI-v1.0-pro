// apps/web/src/lib/shipping/tracking.ts

/**
 * Shipping tracking wrapper
 * Wired up to @magnus-flipper-ai/shipping-engine package
 */

// Local stub (shipping-engine package not available in web build)
async function trackShipment(trackingNumber: string, carrier?: string): Promise<any> {
  // Stub implementation
  return {
    trackingNumber,
    carrier: carrier || "usps",
    status: "unknown",
    events: [],
    estimatedDelivery: null,
    lastUpdated: new Date().toISOString(),
  };
}

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

