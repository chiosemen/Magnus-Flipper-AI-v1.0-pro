/**
 * Alert Rules Engine
 * Main orchestration logic for evaluating alert rules
 */

import type {
  AlertRule,
  ListingToEvaluate,
  EvaluationResult,
  PriceDropConditions,
  KeywordMatchConditions,
  GeoLocationConditions,
  InventoryRestockConditions,
} from "./types";

import { evaluatePriceDrop } from "./evaluators/price-drop";
import { evaluateKeywordMatch } from "./evaluators/keyword-match";
import { evaluateGeoLocation } from "./evaluators/geo-location";
import { evaluateInventoryRestock } from "./evaluators/inventory-restock";

/**
 * Evaluate a single alert rule against a listing
 */
export function evaluateAlertRule(
  rule: AlertRule,
  listing: ListingToEvaluate
): EvaluationResult {
  console.log(
    `[AlertEngine] Evaluating rule "${rule.name}" (${rule.alert_type}) for listing "${listing.title}"`
  );

  // Skip inactive rules
  if (!rule.active) {
    return {
      triggered: false,
      trigger_reason: "Alert rule is inactive",
    };
  }

  // Filter by marketplace (if specified)
  if (rule.marketplace && listing.marketplace !== rule.marketplace) {
    return {
      triggered: false,
      trigger_reason: `Marketplace mismatch: expected ${rule.marketplace}, got ${listing.marketplace}`,
    };
  }

  // Route to appropriate evaluator based on alert type
  let result: EvaluationResult;

  try {
    switch (rule.alert_type) {
      case "PRICE_DROP":
        result = evaluatePriceDrop(
          rule.conditions as PriceDropConditions,
          listing
        );
        break;

      case "KEYWORD_MATCH":
        result = evaluateKeywordMatch(
          rule.conditions as KeywordMatchConditions,
          listing
        );
        break;

      case "GEO_LOCATION":
        result = evaluateGeoLocation(
          rule.conditions as GeoLocationConditions,
          listing
        );
        break;

      case "INVENTORY_RESTOCK":
        result = evaluateInventoryRestock(
          rule.conditions as InventoryRestockConditions,
          listing
        );
        break;

      case "CUSTOM":
        // Custom evaluator - extensible for future use
        result = {
          triggered: false,
          trigger_reason: "Custom alerts not yet implemented",
        };
        break;

      default:
        result = {
          triggered: false,
          trigger_reason: `Unknown alert type: ${rule.alert_type}`,
        };
    }

    if (result.triggered) {
      console.log(
        `[AlertEngine] ✓ Alert triggered: ${rule.name} - ${result.trigger_reason}`
      );
    } else {
      console.log(
        `[AlertEngine] ✗ Alert not triggered: ${rule.name} - ${result.trigger_reason}`
      );
    }

    return result;
  } catch (error: any) {
    console.error(
      `[AlertEngine] Error evaluating rule "${rule.name}":`,
      error.message
    );

    return {
      triggered: false,
      trigger_reason: `Evaluation error: ${error.message}`,
    };
  }
}

/**
 * Evaluate multiple alert rules against a listing
 */
export function evaluateAlertRules(
  rules: AlertRule[],
  listing: ListingToEvaluate
): EvaluationResult[] {
  console.log(
    `[AlertEngine] Evaluating ${rules.length} rules for listing "${listing.title}"`
  );

  const results = rules.map((rule) => ({
    ...evaluateAlertRule(rule, listing),
    ruleId: rule.id,
    ruleName: rule.name,
  }));

  const triggeredCount = results.filter((r) => r.triggered).length;

  console.log(
    `[AlertEngine] Evaluation complete: ${triggeredCount}/${rules.length} alerts triggered`
  );

  return results;
}

/**
 * Batch evaluate alert rules against multiple listings
 */
export function evaluateListingsBatch(
  rules: AlertRule[],
  listings: ListingToEvaluate[]
): Map<string, EvaluationResult[]> {
  console.log(
    `[AlertEngine] Batch evaluation: ${rules.length} rules × ${listings.length} listings`
  );

  const resultsByListing = new Map<string, EvaluationResult[]>();

  for (const listing of listings) {
    const listingKey = listing.id || listing.external_id;
    const results = evaluateAlertRules(rules, listing);
    resultsByListing.set(listingKey, results);
  }

  console.log(`[AlertEngine] Batch evaluation complete`);

  return resultsByListing;
}
