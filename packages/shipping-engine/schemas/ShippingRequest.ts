/**
 * Shipping Request Schemas
 * Types and validation for shipping label requests
 */

import { z } from "zod";

export const AddressSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  street1: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(1),
  country: z.string().default("US"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export type Address = z.infer<typeof AddressSchema>;

export const PackageDimensionsSchema = z.object({
  length: z.number().min(0), // inches
  width: z.number().min(0),
  height: z.number().min(0),
  weight: z.number().min(0), // ounces
  weightUnit: z.enum(["oz", "lb", "g", "kg"]).default("oz"),
  dimensionUnit: z.enum(["in", "cm"]).default("in"),
});

export type PackageDimensions = z.infer<typeof PackageDimensionsSchema>;

export const ShippingRequestSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  saleId: z.string(),
  inventoryItemId: z.string(),
  userId: z.string(),
  marketplace: z.string(),

  // Addresses
  fromAddress: AddressSchema,
  toAddress: AddressSchema,

  // Package details
  dimensions: PackageDimensionsSchema,

  // Shipping preferences
  serviceLevel: z.enum(["standard", "express", "overnight", "international"]).default("standard"),
  carrierPreference: z.enum(["usps", "ups", "fedex", "dhl", "royal_mail", "auto"]).default("auto"),

  // Options
  insuranceValue: z.number().optional(),
  requireSignature: z.boolean().default(false),
  saturdayDelivery: z.boolean().default(false),

  // Item details (for customs)
  itemDescription: z.string(),
  itemValue: z.number(),
  hsCode: z.string().optional(), // Harmonized System code for customs

  // Marketplace constraints
  marketplaceRequirements: z.object({
    maxDeliveryDays: z.number().optional(),
    requiredCarrier: z.string().optional(),
    trackingRequired: z.boolean().default(true),
  }).optional(),

  // Metadata
  createdAt: z.string(),
  requestedBy: z.enum(["auto", "manual"]).default("auto"),
});

export type ShippingRequest = z.infer<typeof ShippingRequestSchema>;

export const CarrierRateSchema = z.object({
  carrier: z.string(),
  service: z.string(),
  rate: z.number(),
  currency: z.string().default("USD"),
  estimatedDays: z.number(),
  deliveryBy: z.string().optional(),
  rateId: z.string().optional(), // For purchasing the label
  metadata: z.record(z.any()).optional(),
});

export type CarrierRate = z.infer<typeof CarrierRateSchema>;

export const ShippingLabelSchema = z.object({
  id: z.string(),
  shippingRequestId: z.string(),
  orderId: z.string(),
  carrier: z.string(),
  service: z.string(),
  trackingNumber: z.string(),
  trackingUrl: z.string().optional(),

  // Label files
  labelUrl: z.string(), // PDF/PNG in Supabase Storage
  labelFormat: z.enum(["pdf", "png", "zpl"]).default("pdf"),

  // Costs
  shippingCost: z.number(),
  insuranceCost: z.number().default(0),
  totalCost: z.number(),
  currency: z.string().default("USD"),

  // Delivery
  estimatedDeliveryDate: z.string().optional(),

  // Status
  status: z.enum(["created", "purchased", "voided", "error"]).default("created"),

  // Timestamps
  createdAt: z.string(),
  purchasedAt: z.string().optional(),
  voidedAt: z.string().optional(),

  // Raw response
  rawResponse: z.any().optional(),
});

export type ShippingLabel = z.infer<typeof ShippingLabelSchema>;

export const TrackingEventSchema = z.object({
  id: z.string(),
  trackingNumber: z.string(),
  carrier: z.string(),
  status: z.enum([
    "pre_transit",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "returned",
    "failed",
    "cancelled",
    "exception"
  ]),
  statusDetail: z.string(),
  location: z.string().optional(),
  timestamp: z.string(),
  estimatedDelivery: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
});

export type TrackingEvent = z.infer<typeof TrackingEventSchema>;

export const FulfillmentEventSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  type: z.enum([
    "label_generated",
    "ready_to_ship",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "exception",
    "returned",
    "cancelled"
  ]),
  description: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
});

export type FulfillmentEvent = z.infer<typeof FulfillmentEventSchema>;

export const PackagingRecommendationSchema = z.object({
  packageType: z.enum([
    "poly_mailer_small",
    "poly_mailer_large",
    "box_small",
    "box_medium",
    "box_large",
    "padded_envelope",
    "tube",
    "custom"
  ]),
  dimensions: PackageDimensionsSchema,
  materials: z.array(z.string()),
  instructions: z.array(z.string()),
  fragile: z.boolean().default(false),
  estimatedCost: z.number().optional(),
});

export type PackagingRecommendation = z.infer<typeof PackagingRecommendationSchema>;

export interface CarrierConfig {
  carrier: string;
  enabled: boolean;
  apiKey?: string;
  accountNumber?: string;
  testMode: boolean;
  supportedServices: string[];
  maxWeight: number; // ounces
  maxDimensions: { length: number; width: number; height: number };
  internationalSupport: boolean;
}

export interface ShippingCostEstimate {
  carrier: string;
  service: string;
  estimatedCost: number;
  estimatedDays: number;
  confidence: number; // 0-1
}
