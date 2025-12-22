/**
 * Magnus Tech Trade Core
 * 
 * Core pricing engine for tech device trade-ins. Provides market-signal-driven
 * pricing with configurable policies, confidence scoring, and liquidity indicators.
 * 
 * @packageDocumentation
 */

// Type exports
export * from './types';

// Pricing Engine
export {
  calculateBasePrice,
  applyAttributeAdjustments,
  applyPolicyFloor,
  generateQuoteBreakdown,
  getConditionMultiplier,
} from './pricing-engine';
export type { QuoteBreakdownInput } from './pricing-engine';

// Device Catalog
export {
  searchDevices,
  getDeviceById,
  validateDeviceAttributes,
  fuzzyMatch,
  groupAttributesByType,
  setDeviceRepository,
} from './device-catalog';
export type {
  DeviceSearchResult,
  TechDeviceWithAttributes,
  DeviceAttributeGroup,
} from './types';

// Anchor Blending
export {
  blendAnchors,
  calculateAnchorConfidence,
  isAnchorStale,
  getAnchorsByCondition,
  redistributeWeights,
} from './anchor-blending';

// Market Indicators
export {
  calculateVolumeMetrics,
  calculateAnchorMetrics,
  calculateConfidenceMetrics,
  calculateMomentum,
  getMarketIndicators,
  setIndicatorRepositories,
} from './market-indicators';

// Policy Enforcement
export {
  enforceFloorPrice,
  enforceMarginRequirement,
  enforceMaxDiscount,
  validatePriceAgainstPolicy,
  calculatePolicyAdjustment,
  isPriceBelowFloor,
  getEffectiveFloor,
  // Risk Control (Kill Switch)
  setRiskControlConfig,
  getRiskControlConfig,
  isPricingHalted,
  checkPricingHalted,
  assertBulkTradeAllowed,
  resetRiskControl,
} from './policy-enforcement';
export type { PolicyValidationResult } from './policy-enforcement';

