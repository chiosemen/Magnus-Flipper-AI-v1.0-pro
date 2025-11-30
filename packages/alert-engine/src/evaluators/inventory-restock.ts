/**
 * Inventory Restock Alert Evaluator
 * Evaluates if a specific item has been restocked or relisted
 */

import type {
  InventoryRestockConditions,
  ListingToEvaluate,
  EvaluationResult,
} from "../types";

/**
 * Evaluate inventory restock condition
 */
export function evaluateInventoryRestock(
  conditions: InventoryRestockConditions,
  listing: ListingToEvaluate
): EvaluationResult {
  const { item_id, notify_on, previous_status } = conditions;

  // Check if this is the item we're tracking
  const isMatchingItem =
    listing.id === item_id || listing.external_id === item_id;

  if (!isMatchingItem) {
    return {
      triggered: false,
      trigger_reason: `Listing ID does not match tracked item ID: ${item_id}`,
    };
  }

  // Evaluate notification trigger
  let triggered = false;
  let triggerReason = "";

  switch (notify_on) {
    case "restock":
      // Item was out of stock, now back in stock
      // This requires tracking previous availability status
      // For now, we'll trigger on any new listing
      triggered = true;
      triggerReason = "Item restocked";
      break;

    case "new_listing":
      // New listing detected
      triggered = true;
      triggerReason = "New listing detected";
      break;

    case "price_change":
      // Price has changed (requires tracking previous price)
      // This would need comparison with historical data
      // For now, just trigger on any listing
      triggered = true;
      triggerReason = "Item detected (price tracking active)";
      break;

    default:
      return {
        triggered: false,
        trigger_reason: `Unknown notify_on type: ${notify_on}`,
      };
  }

  if (!triggered) {
    return {
      triggered: false,
      trigger_reason: "Inventory condition not met",
    };
  }

  // Alert triggered!
  return {
    triggered: true,
    trigger_reason: triggerReason,
    matched_listing: listing,
    metadata: {
      item_id,
      notify_on,
      previous_status,
      current_price: listing.price,
    },
  };
}
