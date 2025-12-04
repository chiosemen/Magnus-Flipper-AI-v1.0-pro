/**
 * Label Generator
 * Orchestrates shipping label creation across all carriers
 */

import { createClient } from "@supabase/supabase-js";
import type {
  ShippingRequest,
  ShippingLabel,
  CarrierConfig,
  CarrierRate,
} from "../schemas/ShippingRequest.js";
import { selectCarrier } from "../carrier/selectCarrier.js";
import { generateUSPSLabel } from "../carrier/carrierClient_USPS.js";
import { generateUPSLabel } from "../carrier/carrierClient_UPS.js";
import { generateFedExLabel } from "../carrier/carrierClient_FedEx.js";
import { generateGenericLabel } from "../carrier/carrierClient_Generic.js";
import { uploadLabelToStorage } from "./labelStorage.js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface LabelGenerationResult {
  success: boolean;
  label?: ShippingLabel;
  error?: string;
}

/**
 * Generate shipping label
 * Main orchestration function
 */
export async function generateShippingLabel(
  request: ShippingRequest
): Promise<LabelGenerationResult> {
  try {
    // Load carrier configurations
    const carrierConfigs = await loadCarrierConfigs(request.userId);

    if (carrierConfigs.length === 0) {
      return {
        success: false,
        error: "No carrier configurations found",
      };
    }

    // Select best carrier
    const selection = await selectCarrier(request, carrierConfigs);

    // Generate label with selected carrier
    const labelData = await generateLabelWithCarrier(
      request,
      selection.selectedRate,
      carrierConfigs.find(
        (c) => c.carrier.toLowerCase() === selection.selectedCarrier.toLowerCase()
      )!
    );

    // Upload label to storage if it contains binary data
    let labelUrl = labelData.labelUrl;
    if (labelData.rawResponse?.labelData) {
      labelUrl = await uploadLabelToStorage(
        labelData.rawResponse.labelData,
        labelData.trackingNumber!,
        labelData.labelFormat!
      );
    }

    // Create complete label record
    const label: ShippingLabel = {
      id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      shippingRequestId: request.id,
      orderId: request.orderId,
      carrier: selection.selectedCarrier,
      service: selection.selectedService,
      trackingNumber: labelData.trackingNumber!,
      trackingUrl: labelData.trackingUrl,
      labelUrl: labelUrl!,
      labelFormat: labelData.labelFormat || "pdf",
      shippingCost: labelData.shippingCost!,
      insuranceCost: labelData.insuranceCost || 0,
      totalCost: labelData.totalCost!,
      currency: labelData.currency || "USD",
      estimatedDeliveryDate: labelData.estimatedDeliveryDate,
      status: "purchased",
      createdAt: new Date().toISOString(),
      purchasedAt: new Date().toISOString(),
      rawResponse: labelData.rawResponse,
    };

    // Store label in database
    await storeLabel(label);

    // Create fulfillment event
    await createFulfillmentEvent({
      orderId: request.orderId,
      type: "label_generated",
      description: `Shipping label generated for ${selection.selectedCarrier} ${selection.selectedService}`,
      metadata: {
        trackingNumber: label.trackingNumber,
        carrier: label.carrier,
        cost: label.totalCost,
      },
    });

    return {
      success: true,
      label,
    };
  } catch (error: any) {
    console.error("Label generation failed:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Generate label with specific carrier
 */
async function generateLabelWithCarrier(
  request: ShippingRequest,
  selectedRate: CarrierRate,
  config: CarrierConfig
): Promise<Partial<ShippingLabel>> {
  switch (config.carrier.toLowerCase()) {
    case "usps":
      return await generateUSPSLabel(request, selectedRate, config);
    case "ups":
      return await generateUPSLabel(request, selectedRate, config);
    case "fedex":
      return await generateFedExLabel(request, selectedRate, config);
    default:
      return await generateGenericLabel(request, selectedRate, config);
  }
}

/**
 * Load carrier configurations from database
 */
async function loadCarrierConfigs(userId: string): Promise<CarrierConfig[]> {
  // In production, load from database
  // For now, return default configurations
  return [
    {
      carrier: "usps",
      enabled: true,
      testMode: true,
      supportedServices: ["Priority", "Express", "Ground"],
      maxWeight: 1120, // 70 lbs in ounces
      maxDimensions: { length: 108, width: 108, height: 108 },
      internationalSupport: true,
    },
    {
      carrier: "ups",
      enabled: true,
      testMode: true,
      supportedServices: ["Ground", "2nd Day Air", "Next Day Air"],
      maxWeight: 2400, // 150 lbs
      maxDimensions: { length: 165, width: 165, height: 165 },
      internationalSupport: true,
    },
    {
      carrier: "fedex",
      enabled: true,
      testMode: true,
      supportedServices: ["Ground", "2Day", "Priority Overnight"],
      maxWeight: 2400, // 150 lbs
      maxDimensions: { length: 119, width: 165, height: 165 },
      internationalSupport: true,
    },
  ];
}

/**
 * Store label in database
 */
async function storeLabel(label: ShippingLabel): Promise<void> {
  await supabase.from("shipping_labels").insert({
    id: label.id,
    shipping_request_id: label.shippingRequestId,
    order_id: label.orderId,
    carrier: label.carrier,
    service: label.service,
    tracking_number: label.trackingNumber,
    tracking_url: label.trackingUrl,
    label_url: label.labelUrl,
    label_format: label.labelFormat,
    shipping_cost: label.shippingCost,
    insurance_cost: label.insuranceCost,
    total_cost: label.totalCost,
    currency: label.currency,
    estimated_delivery_date: label.estimatedDeliveryDate,
    status: label.status,
    created_at: label.createdAt,
    purchased_at: label.purchasedAt,
    raw_response: label.rawResponse,
  });
}

/**
 * Create fulfillment event
 */
async function createFulfillmentEvent(event: {
  orderId: string;
  type: string;
  description: string;
  metadata?: any;
}): Promise<void> {
  await supabase.from("fulfillment_events").insert({
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    order_id: event.orderId,
    type: event.type,
    description: event.description,
    timestamp: new Date().toISOString(),
    metadata: event.metadata,
    created_at: new Date().toISOString(),
  });
}

/**
 * Void shipping label
 */
export async function voidShippingLabel(
  labelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: label } = await supabase
      .from("shipping_labels")
      .select("*")
      .eq("id", labelId)
      .single();

    if (!label) {
      return { success: false, error: "Label not found" };
    }

    if (label.status === "voided") {
      return { success: false, error: "Label already voided" };
    }

    // Call carrier API to void label (carrier-specific implementation)
    // For now, just update database

    await supabase
      .from("shipping_labels")
      .update({
        status: "voided",
        voided_at: new Date().toISOString(),
      })
      .eq("id", labelId);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Regenerate label (if first attempt failed)
 */
export async function regenerateLabel(
  shippingRequestId: string
): Promise<LabelGenerationResult> {
  const { data: request } = await supabase
    .from("shipping_requests")
    .select("*")
    .eq("id", shippingRequestId)
    .single();

  if (!request) {
    return { success: false, error: "Shipping request not found" };
  }

  return await generateShippingLabel(request);
}

/**
 * Get label by tracking number
 */
export async function getLabelByTrackingNumber(
  trackingNumber: string
): Promise<ShippingLabel | null> {
  const { data, error } = await supabase
    .from("shipping_labels")
    .select("*")
    .eq("tracking_number", trackingNumber)
    .single();

  if (error || !data) return null;

  return data as ShippingLabel;
}
