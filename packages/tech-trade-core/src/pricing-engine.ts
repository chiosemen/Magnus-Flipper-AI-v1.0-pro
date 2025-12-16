/**
 * Pricing Engine Module
 * 
 * Core pricing logic for tech device trade-ins. Calculates quotes based on
 * device base price, condition, attributes, market anchors, and policy rules.
 */

import type {
  TechDevice,
  DeviceAttribute,
  PricingPolicy,
  Condition,
  MarketAnchor,
  QuoteBreakdown,
} from './types';
import { blendAnchors } from './anchor-blending';
import { enforceFloorPrice, enforceMarginRequirement, isPricingHalted } from './policy-enforcement';

/**
 * Round a number to 2 decimal places
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Get the condition multiplier from policy
 * 
 * Condition multipliers reduce the base price based on device condition:
 * - new: 1.0 (no reduction)
 * - excellent: 0.85 (15% reduction)
 * - good: 0.70 (30% reduction)
 * - fair: 0.50 (50% reduction)
 * 
 * @param condition - The device condition
 * @param policy - The pricing policy
 * @returns Multiplier between 0 and 1
 */
export function getConditionMultiplier(
  condition: Condition,
  policy: PricingPolicy
): number {
  switch (condition) {
    case 'new':
      return policy.conditionNew;
    case 'excellent':
      return policy.conditionExcellent;
    case 'good':
      return policy.conditionGood;
    case 'fair':
      return policy.conditionFair;
    default:
      // Default to fair if unknown condition
      return policy.conditionFair;
  }
}

/**
 * Calculate base price with condition multiplier applied
 * 
 * @param device - The tech device
 * @param condition - The device condition
 * @param policy - The pricing policy
 * @returns Base price after condition multiplier
 */
export function calculateBasePrice(
  device: TechDevice,
  condition: Condition,
  policy: PricingPolicy
): number {
  const multiplier = getConditionMultiplier(condition, policy);
  return round2(device.basePrice * multiplier);
}

/**
 * Calculate total attribute adjustments
 * 
 * Attributes modify the price based on device configuration:
 * - Storage: Higher storage = positive modifier, lower = negative
 * - Color: Rare colors may have positive modifier
 * - Carrier: Locked devices have negative modifier
 * 
 * @param selectedAttributes - User-selected attributes
 * @param deviceAttributes - Available device attributes with modifiers
 * @returns Total price adjustment (can be positive or negative)
 */
export function applyAttributeAdjustments(
  selectedAttributes: Record<string, string>,
  deviceAttributes: DeviceAttribute[]
): number {
  let totalAdjustment = 0;

  for (const [type, value] of Object.entries(selectedAttributes)) {
    // Find matching attribute
    const attr = deviceAttributes.find(
      a => a.attributeType === type && a.attributeValue === value
    );

    if (attr) {
      totalAdjustment += attr.priceModifier;
    }
    // Unknown attributes are ignored (return 0 adjustment)
  }

  return round2(totalAdjustment);
}

/**
 * Apply policy floor to ensure minimum price
 * 
 * Uses the higher of:
 * - Absolute floor from policy
 * - Margin-based floor (if cost is provided)
 * 
 * @param price - The calculated price
 * @param policy - The pricing policy
 * @param cost - Optional acquisition cost for margin calculation
 * @returns Price after floor enforcement
 */
export function applyPolicyFloor(
  price: number,
  policy: PricingPolicy,
  cost?: number
): number {
  // First enforce absolute floor
  let result = enforceFloorPrice(price, policy);

  // Then enforce margin if cost is provided
  if (cost !== undefined && cost > 0) {
    result = enforceMarginRequirement(result, cost, policy);
  }

  return result;
}

/**
 * Input parameters for quote breakdown generation
 */
export interface QuoteBreakdownInput {
  device: TechDevice;
  condition: Condition;
  attributes: Record<string, string>;
  deviceAttributes: DeviceAttribute[];
  anchors: MarketAnchor[];
  policy: PricingPolicy;
  cost?: number;
}

/**
 * Generate a complete quote breakdown
 * 
 * Calculation flow:
 * 1. Start with device base price
 * 2. Apply condition multiplier
 * 3. Add attribute adjustments
 * 4. Blend with market anchors (if available AND pricing not halted)
 * 5. Apply policy floor
 * 
 * When pricing is halted (kill switch active):
 * - Anchor blending is SKIPPED (fallback to policy-only pricing)
 * - Quote is marked as pricingFrozen: true
 * - B2C quotes still work, just without market signals
 * 
 * @param input - Quote calculation inputs
 * @returns Complete price breakdown with pricingFrozen flag
 */
export function generateQuoteBreakdown(input: QuoteBreakdownInput): QuoteBreakdown {
  const {
    device,
    condition,
    attributes,
    deviceAttributes,
    anchors,
    policy,
    cost,
  } = input;

  // Check kill switch state FIRST
  const pricingFrozen = isPricingHalted();

  // Step 1: Base price
  const basePrice = device.basePrice;

  // Step 2: Apply condition multiplier
  const conditionMultiplier = getConditionMultiplier(condition, policy);
  const afterCondition = round2(basePrice * conditionMultiplier);

  // Step 3: Apply attribute adjustments
  const attributeAdjustment = applyAttributeAdjustments(attributes, deviceAttributes);
  const afterAttributes = round2(afterCondition + attributeAdjustment);

  // Step 4: Blend with market anchors (SKIP if pricing is halted)
  let anchorBlendedPrice: number | null = null;
  let priceBeforePolicy = afterAttributes;

  // Only blend anchors if:
  // 1. Pricing is NOT halted (kill switch off)
  // 2. We have anchors to blend
  if (!pricingFrozen && anchors.length > 0) {
    const blendResult = blendAnchors(anchors, afterAttributes, policy, condition);
    if (blendResult.blendedPrice !== null) {
      anchorBlendedPrice = blendResult.blendedPrice;
      priceBeforePolicy = anchorBlendedPrice;
    }
  }

  // Step 5: Apply policy floor
  const finalPrice = applyPolicyFloor(priceBeforePolicy, policy, cost);
  const policyAdjustment = round2(finalPrice - priceBeforePolicy);

  return {
    basePrice,
    conditionMultiplier,
    afterCondition,
    attributeAdjustment,
    afterAttributes,
    anchorBlendedPrice,
    policyAdjustment,
    finalPrice,
    pricingFrozen,
  };
}

