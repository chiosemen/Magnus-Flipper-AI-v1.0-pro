/**
 * Shipping Engine Package Entry Point
 * Export all public APIs for Agent G: Automated Shipping & Fulfillment
 */

// Carrier Selection
export {
  selectCarrier,
  getCheapestRate,
  getFastestRate,
  filterRatesByPrice,
  filterRatesBySpeed,
  type CarrierSelectionResult,
} from "./carrier/selectCarrier.js";

export {
  calculateEstimatedRate,
  calculateDimensionalWeight,
  getBillableWeight,
} from "./carrier/rateCalculator.js";

// Label Generation
export {
  generateShippingLabel,
  voidShippingLabel,
  regenerateLabel,
  getLabelByTrackingNumber,
  type LabelGenerationResult,
} from "./label/labelGenerator.js";

export {
  uploadLabelToStorage,
  deleteLabelFromStorage,
  getLabelFromStorage,
  regenerateSignedUrl,
  listLabelsForOrder,
  cleanupOldLabels,
} from "./label/labelStorage.js";

// Tracking
export {
  trackShipment,
  batchTrackShipments,
  getTrackingHistory,
  pollActiveShipments,
} from "./tracking/trackingManager.js";

// Fulfillment Workflow
export {
  startFulfillmentWorkflow,
  markShipmentAsShipped,
  completeFulfillmentWorkflow,
  getFulfillmentWorkflowStatus,
  type FulfillmentWorkflow,
  type FulfillmentStep,
} from "./workflow/fulfillmentOrchestrator.js";

export {
  recommendPackaging,
  calculatePackingCost,
  getPackingChecklist,
  type ItemCharacteristics,
} from "./workflow/packagingAdvisor.js";

// Schemas and Types
export type {
  Address,
  PackageDimensions,
  ShippingRequest,
  CarrierRate,
  ShippingLabel,
  TrackingEvent,
  FulfillmentEvent,
  PackagingRecommendation,
  CarrierConfig,
  ShippingCostEstimate,
} from "./schemas/ShippingRequest.js";

export {
  AddressSchema,
  PackageDimensionsSchema,
  ShippingRequestSchema,
  CarrierRateSchema,
  ShippingLabelSchema,
  TrackingEventSchema,
  FulfillmentEventSchema,
  PackagingRecommendationSchema,
} from "./schemas/ShippingRequest.js";
