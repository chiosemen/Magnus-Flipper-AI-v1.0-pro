/**
 * Magnus Tech Trade Core - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types used across
 * the tech-trade-core package.
 */

// ============================================================================
// Enums
// ============================================================================

export type Condition = 'new' | 'excellent' | 'good' | 'fair';

export type AnchorStatus = 'pending' | 'approved' | 'rejected';

export type QuoteStatus = 'pending' | 'accepted' | 'expired' | 'rejected';

export type AnchorSource = 'cex' | 'back_market';

export type MomentumTrend = 'up' | 'down' | 'stable';

// ============================================================================
// Device Catalog Types
// ============================================================================

export interface TechDevice {
  id: string;
  brand: string;
  model: string;
  category: string;
  releaseYear: number;
  basePrice: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceAttribute {
  id: string;
  deviceId: string;
  attributeType: string;
  attributeValue: string;
  priceModifier: number;
  createdAt: Date;
}

export interface TechDeviceWithAttributes extends TechDevice {
  attributes: DeviceAttributeGroup[];
}

export interface DeviceAttributeGroup {
  type: string;
  values: string[];
  modifiers: { value: string; priceModifier: number }[];
}

export interface DeviceSearchParams {
  query?: string;
  brand?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface DeviceSearchResult {
  devices: TechDeviceWithAttributes[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Market Anchor Types
// ============================================================================

export interface MarketAnchor {
  id: string;
  deviceId: string;
  source: AnchorSource;
  condition: Condition;
  price: number;
  url: string | null;
  scrapedAt: Date;
  status: AnchorStatus;
  approvedAt: Date | null;
  approvedBy: string | null;
  version: number;
  createdAt: Date;
}

export interface RawAnchor {
  deviceBrand: string;
  deviceModel: string;
  source: AnchorSource;
  condition: Condition;
  price: number;
  currency: string;
  url: string;
  scrapedAt: Date;
}

// ============================================================================
// Pricing Policy Types
// ============================================================================

export interface PricingPolicy {
  id: string;
  name: string;
  category: string | null;
  
  // Condition multipliers
  conditionNew: number;
  conditionExcellent: number;
  conditionGood: number;
  conditionFair: number;
  
  // Anchor weights
  weightCex: number;
  weightBackMarket: number;
  weightPolicy: number;
  
  // Policy floors
  minMarginPercent: number;
  absoluteFloor: number;
  
  // Staleness
  anchorMaxAgeDays: number;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PRICING_POLICY: Omit<PricingPolicy, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'default',
  category: null,
  conditionNew: 1.0,
  conditionExcellent: 0.85,
  conditionGood: 0.70,
  conditionFair: 0.50,
  weightCex: 0.40,
  weightBackMarket: 0.40,
  weightPolicy: 0.20,
  minMarginPercent: 0.15,
  absoluteFloor: 10.0,
  anchorMaxAgeDays: 7,
  isActive: true,
};

// ============================================================================
// Quote Types
// ============================================================================

export interface QuoteRequest {
  deviceId: string;
  condition: Condition;
  attributes: Record<string, string>;
  userId?: string;
}

export interface QuoteBreakdown {
  basePrice: number;
  conditionMultiplier: number;
  afterCondition: number;
  attributeAdjustment: number;
  afterAttributes: number;
  anchorBlendedPrice: number | null;
  policyAdjustment: number;
  finalPrice: number;
}

export interface DeviceQuote {
  id: string;
  deviceId: string;
  userId: string | null;
  condition: Condition;
  attributes: Record<string, string>;
  
  // Price breakdown
  basePrice: number;
  conditionMultiplier: number;
  attributeAdjustment: number;
  anchorBlendedPrice: number | null;
  policyAdjustment: number;
  finalPrice: number;
  
  // Metadata
  confidence: number;
  expiresAt: Date;
  status: QuoteStatus;
  anchorSnapshot: MarketAnchor[];
  policyId: string;
  createdAt: Date;
}

export interface QuoteResult {
  quoteId: string;
  device: {
    id: string;
    brand: string;
    model: string;
  };
  condition: Condition;
  attributes: Record<string, string>;
  breakdown: QuoteBreakdown;
  confidence: number;
  warnings: string[];
  expiresAt: Date;
  status: QuoteStatus;
}

// ============================================================================
// Anchor Blending Types
// ============================================================================

export interface AnchorBlendResult {
  blendedPrice: number | null;
  confidence: number;
  warnings: string[];
  anchorsUsed: MarketAnchor[];
}

export interface AnchorFilters {
  deviceId?: string;
  source?: AnchorSource;
  status?: AnchorStatus;
  minScrapedAt?: Date;
}

// ============================================================================
// Approval Types
// ============================================================================

export interface ApprovalRequest {
  anchorIds: string[];
  action: 'approve' | 'reject';
  adminId: string;
  versions: Record<string, number>;
}

export interface ApprovalResult {
  approved: string[];
  rejected: string[];
  conflicts: string[];
}

export interface AuditEntry {
  anchorId: string;
  action: 'approve' | 'reject';
  adminId: string;
  timestamp: Date;
  previousStatus: AnchorStatus;
  newStatus: AnchorStatus;
}

// ============================================================================
// Market Indicator Types
// ============================================================================

export interface VolumeMetrics {
  quotesToday: number;
  quotesThisWeek: number;
  quotesThisMonth: number;
  quotesByDay: { date: string; count: number }[];
}

export interface AnchorMetrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  stale: number;
  bySource: Record<AnchorSource, { total: number; approved: number; stale: number }>;
}

export interface ConfidenceMetrics {
  overall: number;
  bySource: Record<AnchorSource, number>;
  factors: {
    freshness: number;
    sourceAgreement: number;
    coverage: number;
  };
}

export interface MomentumMetrics {
  trend: MomentumTrend;
  percentChange7d: number;
  percentChange30d: number;
  priceHistory: { date: string; avgPrice: number }[];
}

export interface MarketIndicators {
  volume: VolumeMetrics;
  anchors: AnchorMetrics;
  confidence: ConfidenceMetrics;
  momentum: MomentumMetrics;
  generatedAt: Date;
}

export interface IndicatorFilters {
  deviceId?: string;
  source?: AnchorSource;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export class DeviceNotFoundError extends Error {
  constructor(deviceId: string) {
    super(`Device not found: ${deviceId}`);
    this.name = 'DeviceNotFoundError';
  }
}

export class InvalidAttributesError extends Error {
  constructor(attributes: Record<string, string>) {
    super(`Invalid attributes: ${JSON.stringify(attributes)}`);
    this.name = 'InvalidAttributesError';
  }
}

export class QuoteExpiredError extends Error {
  constructor(quoteId: string) {
    super(`Quote expired: ${quoteId}`);
    this.name = 'QuoteExpiredError';
  }
}

export class VersionConflictError extends Error {
  constructor(anchorId: string) {
    super(`Version conflict for anchor: ${anchorId}`);
    this.name = 'VersionConflictError';
  }
}

