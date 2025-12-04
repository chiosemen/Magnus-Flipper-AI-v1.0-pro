/**
 * Fulfillment Orchestrator
 * Manages the complete fulfillment workflow from sale to delivery
 */

// Using interface instead of importing to avoid circular dependency
interface FinalizedSale {
  id: string;
  inventoryItemId: string;
  marketplace: string;
  salePrice: number;
}

import type { ShippingRequest, ShippingLabel } from "../schemas/ShippingRequest.js";
import { generateShippingLabel } from "../label/labelGenerator.js";
import { recommendPackaging } from "./packagingAdvisor.js";
import { trackShipment } from "../tracking/trackingManager.js";

export interface FulfillmentWorkflow {
  saleId: string;
  orderId: string;
  status:
    | "pending"
    | "label_generated"
    | "ready_to_ship"
    | "shipped"
    | "delivered"
    | "exception";
  currentStep: string;
  steps: FulfillmentStep[];
  createdAt: string;
  completedAt?: string;
}

export interface FulfillmentStep {
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metadata?: any;
}

/**
 * Start fulfillment workflow for a sold item
 */
export async function startFulfillmentWorkflow(
  sale: FinalizedSale,
  inventoryItem: any,
  buyerAddress: any
): Promise<FulfillmentWorkflow> {
  const workflow: FulfillmentWorkflow = {
    saleId: sale.id,
    orderId: sale.id,
    status: "pending",
    currentStep: "create_shipping_request",
    steps: [
      { name: "create_shipping_request", status: "pending" },
      { name: "recommend_packaging", status: "pending" },
      { name: "generate_label", status: "pending" },
      { name: "prepare_shipment", status: "pending" },
      { name: "ship_item", status: "pending" },
      { name: "track_delivery", status: "pending" },
    ],
    createdAt: new Date().toISOString(),
  };

  try {
    // Step 1: Create shipping request
    await updateStep(workflow, "create_shipping_request", "in_progress");
    const shippingRequest = await createShippingRequest(
      sale,
      inventoryItem,
      buyerAddress
    );
    await updateStep(workflow, "create_shipping_request", "completed", {
      requestId: shippingRequest.id,
    });

    // Step 2: Recommend packaging
    await updateStep(workflow, "recommend_packaging", "in_progress");
    const packagingRec = recommendPackaging({
      weight: inventoryItem.weight || 16,
      dimensions: inventoryItem.dimensions,
      fragile: inventoryItem.fragile || false,
      category: inventoryItem.category,
      value: sale.salePrice,
    });
    await updateStep(workflow, "recommend_packaging", "completed", {
      recommendation: packagingRec,
    });

    // Step 3: Generate label
    await updateStep(workflow, "generate_label", "in_progress");
    const labelResult = await generateShippingLabel(shippingRequest);

    if (!labelResult.success) {
      await updateStep(workflow, "generate_label", "failed", {
        error: labelResult.error,
      });
      workflow.status = "exception";
      return workflow;
    }

    await updateStep(workflow, "generate_label", "completed", {
      label: labelResult.label,
    });

    // Step 4: Prepare shipment (manual step - mark as ready)
    await updateStep(workflow, "prepare_shipment", "pending");
    workflow.status = "ready_to_ship";

    return workflow;
  } catch (error: any) {
    workflow.status = "exception";
    const currentStepIdx = workflow.steps.findIndex(
      (s) => s.status === "in_progress"
    );
    if (currentStepIdx >= 0) {
      workflow.steps[currentStepIdx].status = "failed";
      workflow.steps[currentStepIdx].error = error.message;
    }
    return workflow;
  }
}

/**
 * Create shipping request from sale data
 */
async function createShippingRequest(
  sale: FinalizedSale,
  inventoryItem: any,
  buyerAddress: any
): Promise<ShippingRequest> {
  return {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orderId: sale.id,
    saleId: sale.id,
    inventoryItemId: sale.inventoryItemId,
    userId: inventoryItem.user_id,
    marketplace: sale.marketplace,
    fromAddress: {
      name: "Your Store Name",
      street1: "123 Warehouse St",
      city: "Your City",
      state: "CA",
      postalCode: "90001",
      country: "US",
      phone: "555-0100",
    },
    toAddress: {
      name: buyerAddress.name,
      street1: buyerAddress.street1,
      street2: buyerAddress.street2,
      city: buyerAddress.city,
      state: buyerAddress.state,
      postalCode: buyerAddress.postalCode,
      country: buyerAddress.country || "US",
      phone: buyerAddress.phone,
    },
    dimensions: {
      length: inventoryItem.dimensions?.length || 12,
      width: inventoryItem.dimensions?.width || 9,
      height: inventoryItem.dimensions?.height || 3,
      weight: inventoryItem.weight || 16,
      weightUnit: "oz",
      dimensionUnit: "in",
    },
    serviceLevel: determineServiceLevel(sale.marketplace),
    carrierPreference: "auto",
    requireSignature: false,
    saturdayDelivery: false,
    itemDescription: inventoryItem.title,
    itemValue: sale.salePrice,
    createdAt: new Date().toISOString(),
    requestedBy: "auto",
  };
}

/**
 * Determine service level based on marketplace
 */
function determineServiceLevel(
  marketplace: string
): ShippingRequest["serviceLevel"] {
  // Premium marketplaces may require faster shipping
  const expressMarketplaces = ["poshmark"];

  if (expressMarketplaces.includes(marketplace.toLowerCase())) {
    return "express";
  }

  return "standard";
}

/**
 * Update workflow step
 */
async function updateStep(
  workflow: FulfillmentWorkflow,
  stepName: string,
  status: FulfillmentStep["status"],
  metadata?: any
): Promise<void> {
  const step = workflow.steps.find((s) => s.name === stepName);
  if (!step) return;

  step.status = status;

  if (status === "in_progress") {
    step.startedAt = new Date().toISOString();
  } else if (status === "completed" || status === "failed") {
    step.completedAt = new Date().toISOString();
    if (metadata) {
      step.metadata = metadata;
    }
  }

  workflow.currentStep = stepName;
}

/**
 * Mark shipment as shipped
 */
export async function markShipmentAsShipped(
  workflowId: string,
  trackingNumber: string
): Promise<void> {
  // Update workflow
  // In production, load workflow from database
}

/**
 * Complete fulfillment workflow
 */
export async function completeFulfillmentWorkflow(
  workflowId: string
): Promise<void> {
  // Mark workflow as completed
  // In production, update database
}

/**
 * Get fulfillment workflow status
 */
export async function getFulfillmentWorkflowStatus(
  orderId: string
): Promise<FulfillmentWorkflow | null> {
  // Load from database
  // For now, return null
  return null;
}
