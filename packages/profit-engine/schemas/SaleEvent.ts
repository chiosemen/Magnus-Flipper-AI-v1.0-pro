/**
 * Sale Event Schema
 * Represents a sale event from any marketplace
 */

import { z } from "zod";

export const SaleEventSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  inventoryItemId: z.string(),
  marketplace: z.enum(["ebay", "vinted", "depop", "facebook", "offerup", "poshmark"]),
  salePrice: z.number().min(0),
  currency: z.enum(["USD", "GBP", "EUR"]).default("USD"),
  buyerInfo: z.object({
    id: z.string(),
    name: z.string().optional(),
    location: z.string().optional(),
    verified: z.boolean().optional(),
  }),
  soldAt: z.string(),
  shippingRequired: z.boolean().default(true),
  shippingAddress: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string(),
      country: z.string(),
    })
    .optional(),
  rawEvent: z.any(),
});

export type SaleEvent = z.infer<typeof SaleEventSchema>;

export const FinalizedSaleSchema = z.object({
  id: z.string(),
  saleEventId: z.string(),
  listingId: z.string(),
  inventoryItemId: z.string(),
  marketplace: z.string(),
  salePrice: z.number(),
  acquiredPrice: z.number(),
  marketplaceFees: z.number(),
  shippingCost: z.number(),
  otherCosts: z.number().default(0),
  grossProfit: z.number(),
  netProfit: z.number(),
  roi: z.number(),
  holdingTime: z.number(), // days
  soldAt: z.string(),
  finalizedAt: z.string(),
  status: z.enum(["pending_shipment", "shipped", "delivered", "completed", "refunded"]),
  trackingNumber: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type FinalizedSale = z.infer<typeof FinalizedSaleSchema>;

export const LedgerEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  inventoryItemId: z.string().optional(),
  saleId: z.string().optional(),
  type: z.enum([
    "acquisition",
    "sale",
    "fee",
    "shipping",
    "refund",
    "adjustment",
    "tax",
  ]),
  amount: z.number(),
  currency: z.string().default("USD"),
  description: z.string(),
  transactionDate: z.string(),
  marketplace: z.string().optional(),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const EVCorrectionSchema = z.object({
  id: z.string(),
  saleId: z.string(),
  inventoryItemId: z.string(),
  category: z.string(),
  marketplace: z.string(),
  expectedValue: z.number(),
  actualValue: z.number(),
  variance: z.number(),
  variancePercent: z.number(),
  originalConfidence: z.number(),
  correctionFactor: z.number(),
  learningWeight: z.number(),
  createdAt: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type EVCorrection = z.infer<typeof EVCorrectionSchema>;

export const PortfolioSnapshotSchema = z.object({
  id: z.string(),
  userId: z.string(),
  snapshotDate: z.string(),
  totalInventoryValue: z.number(),
  totalInvestedCapital: z.number(),
  totalRealizedProfit: z.number(),
  totalUnrealizedProfit: z.number(),
  activeListings: z.number(),
  soldItems: z.number(),
  avgHoldingTime: z.number(),
  portfolioROI: z.number(),
  winRate: z.number(), // % of profitable sales
  bestPerformingCategory: z.string().optional(),
  worstPerformingCategory: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
});

export type PortfolioSnapshot = z.infer<typeof PortfolioSnapshotSchema>;

export interface PnLSummary {
  period: { start: string; end: string };
  totalRevenue: number;
  totalCosts: number;
  totalFees: number;
  totalShipping: number;
  netProfit: number;
  roi: number;
  itemsSold: number;
  avgProfitPerItem: number;
  avgROIPerItem: number;
  avgHoldingTime: number;
  winRate: number;
  byMarketplace: Record<
    string,
    {
      revenue: number;
      costs: number;
      fees: number;
      profit: number;
      roi: number;
      itemsSold: number;
    }
  >;
  byCategory: Record<
    string,
    {
      revenue: number;
      costs: number;
      profit: number;
      roi: number;
      itemsSold: number;
    }
  >;
}

export interface HistoricalStats {
  category: string;
  marketplace: string;
  avgExpectedValue: number;
  avgActualValue: number;
  avgVariance: number;
  stdDeviation: number;
  sampleSize: number;
  lastUpdated: string;
}
