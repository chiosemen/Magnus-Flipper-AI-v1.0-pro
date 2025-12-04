/**
 * Tracking Manager
 * Monitors shipment status and normalizes tracking events
 */

import { createClient } from "@supabase/supabase-js";
import type { TrackingEvent } from "../schemas/ShippingRequest.js";
import { trackUSPSShipment } from "../carrier/carrierClient_USPS.js";
import { trackUPSShipment } from "../carrier/carrierClient_UPS.js";
import { trackFedExShipment } from "../carrier/carrierClient_FedEx.js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Track shipment and update database
 */
export async function trackShipment(
  trackingNumber: string,
  carrier: string
): Promise<TrackingEvent[]> {
  try {
    // Get carrier config
    const config = await getCarrierConfig(carrier);

    // Fetch tracking data from carrier
    const rawTracking = await fetchCarrierTracking(trackingNumber, carrier, config);

    // Normalize tracking events
    const events = normalizeTrackingData(rawTracking, trackingNumber, carrier);

    // Store events in database
    for (const event of events) {
      await storeTrackingEvent(event);
    }

    // Update order status based on latest event
    if (events.length > 0) {
      await updateOrderStatus(trackingNumber, events[0]);
    }

    return events;
  } catch (error) {
    console.error(`Tracking failed for ${trackingNumber}:`, error);
    return [];
  }
}

/**
 * Fetch tracking from carrier API
 */
async function fetchCarrierTracking(
  trackingNumber: string,
  carrier: string,
  config: any
): Promise<any> {
  switch (carrier.toLowerCase()) {
    case "usps":
      return await trackUSPSShipment(trackingNumber, config);
    case "ups":
      return await trackUPSShipment(trackingNumber, config);
    case "fedex":
      return await trackFedExShipment(trackingNumber, config);
    default:
      return { status: "unknown", events: [] };
  }
}

/**
 * Normalize tracking data to standard format
 */
function normalizeTrackingData(
  rawData: any,
  trackingNumber: string,
  carrier: string
): TrackingEvent[] {
  // Simplified normalization - production would handle carrier-specific formats
  const events: TrackingEvent[] = [];

  if (rawData.status) {
    events.push({
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trackingNumber,
      carrier,
      status: normalizeStatus(rawData.status),
      statusDetail: rawData.statusDetail || rawData.status,
      location: rawData.location,
      timestamp: new Date().toISOString(),
      estimatedDelivery: rawData.estimatedDelivery,
      createdAt: new Date().toISOString(),
    });
  }

  return events;
}

/**
 * Normalize status to standard values
 */
function normalizeStatus(
  rawStatus: string
): TrackingEvent["status"] {
  const status = rawStatus.toLowerCase();

  if (status.includes("delivered")) return "delivered";
  if (status.includes("out for delivery")) return "out_for_delivery";
  if (status.includes("in transit") || status.includes("transit"))
    return "in_transit";
  if (status.includes("exception") || status.includes("delay"))
    return "exception";
  if (status.includes("returned")) return "returned";
  if (status.includes("cancelled")) return "cancelled";

  return "pre_transit";
}

/**
 * Store tracking event in database
 */
async function storeTrackingEvent(event: TrackingEvent): Promise<void> {
  // Check if event already exists
  const { data: existing } = await supabase
    .from("tracking_events")
    .select("id")
    .eq("tracking_number", event.trackingNumber)
    .eq("timestamp", event.timestamp)
    .single();

  if (existing) return; // Skip duplicates

  await supabase.from("tracking_events").insert({
    id: event.id,
    tracking_number: event.trackingNumber,
    carrier: event.carrier,
    status: event.status,
    status_detail: event.statusDetail,
    location: event.location,
    timestamp: event.timestamp,
    estimated_delivery: event.estimatedDelivery,
    metadata: event.metadata,
    created_at: event.createdAt,
  });
}

/**
 * Update order status based on tracking event
 */
async function updateOrderStatus(
  trackingNumber: string,
  latestEvent: TrackingEvent
): Promise<void> {
  const { data: label } = await supabase
    .from("shipping_labels")
    .select("order_id")
    .eq("tracking_number", trackingNumber)
    .single();

  if (!label) return;

  // Update sold_items status
  let orderStatus = "shipped";
  if (latestEvent.status === "delivered") {
    orderStatus = "delivered";
  } else if (latestEvent.status === "out_for_delivery") {
    orderStatus = "out_for_delivery";
  } else if (latestEvent.status === "returned") {
    orderStatus = "returned";
  }

  await supabase
    .from("sold_items")
    .update({
      status: orderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", label.order_id);

  // Create fulfillment event
  await supabase.from("fulfillment_events").insert({
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    order_id: label.order_id,
    type: latestEvent.status,
    description: latestEvent.statusDetail,
    timestamp: latestEvent.timestamp,
    metadata: { trackingNumber, location: latestEvent.location },
    created_at: new Date().toISOString(),
  });
}

/**
 * Batch track multiple shipments
 */
export async function batchTrackShipments(
  trackingNumbers: Array<{ trackingNumber: string; carrier: string }>
): Promise<Array<{ trackingNumber: string; carrier: string; success: boolean; events?: TrackingEvent[] }>> {
  const results = await Promise.allSettled(
    trackingNumbers.map(({ trackingNumber, carrier }) =>
      trackShipment(trackingNumber, carrier)
    )
  );

  return results.map((result, index) => ({
    trackingNumber: trackingNumbers[index].trackingNumber,
    carrier: trackingNumbers[index].carrier,
    success: result.status === 'fulfilled',
    events: result.status === 'fulfilled' ? result.value : undefined,
  }));
}

/**
 * Get tracking history for order
 */
export async function getTrackingHistory(
  trackingNumber: string
): Promise<TrackingEvent[]> {
  const { data, error } = await supabase
    .from("tracking_events")
    .select("*")
    .eq("tracking_number", trackingNumber)
    .order("timestamp", { ascending: false });

  if (error || !data) return [];

  return data.map((event) => ({
    id: event.id,
    trackingNumber: event.tracking_number,
    carrier: event.carrier,
    status: event.status,
    statusDetail: event.status_detail,
    location: event.location,
    timestamp: event.timestamp,
    estimatedDelivery: event.estimated_delivery,
    metadata: event.metadata,
    createdAt: event.created_at,
  }));
}

/**
 * Get carrier config
 */
async function getCarrierConfig(carrier: string): Promise<any> {
  return {
    carrier,
    enabled: true,
    testMode: true,
  };
}

/**
 * Poll all active shipments for updates
 */
export async function pollActiveShipments(): Promise<void> {
  const { data: activeLabels } = await supabase
    .from("shipping_labels")
    .select("tracking_number, carrier")
    .in("status", ["purchased", "shipped"])
    .limit(100);

  if (!activeLabels) return;

  await batchTrackShipments(
    activeLabels.map((label) => ({
      trackingNumber: label.tracking_number,
      carrier: label.carrier,
    }))
  );
}
