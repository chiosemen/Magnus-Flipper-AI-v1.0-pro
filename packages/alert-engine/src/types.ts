/**
 * Alert Engine Types
 * Type definitions for alert rules, conditions, and evaluation results
 */

export type AlertType =
  | "PRICE_DROP"
  | "KEYWORD_MATCH"
  | "INVENTORY_RESTOCK"
  | "GEO_LOCATION"
  | "CUSTOM";

export type NotificationChannel = "EMAIL" | "SMS" | "PUSH" | "WEBHOOK";

export type Marketplace =
  | "VINTED"
  | "EBAY"
  | "GUMTREE"
  | "FB_MARKETPLACE"
  | "CRAIGSLIST"
  | "OFFERUP";

/**
 * Alert Rule Configuration
 */
export interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  alert_type: AlertType;
  marketplace?: Marketplace;
  search_query?: string;
  conditions: AlertConditions;
  notification_channels: NotificationChannel[];
  webhook_url?: string;
  webhook_headers?: Record<string, string>;
  active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Alert Conditions (union type for all condition types)
 */
export type AlertConditions =
  | PriceDropConditions
  | KeywordMatchConditions
  | GeoLocationConditions
  | InventoryRestockConditions
  | CustomConditions;

/**
 * Price Drop Alert Conditions
 */
export interface PriceDropConditions {
  price_threshold: number;
  currency: string;
  comparison: "less_than" | "less_than_or_equal" | "greater_than" | "greater_than_or_equal";
  location?: string;
  radius_km?: number;
}

/**
 * Keyword Match Alert Conditions
 */
export interface KeywordMatchConditions {
  keywords: string[];
  match_type: "any" | "all";
  case_sensitive?: boolean;
  exact_match?: boolean;
}

/**
 * Geo-Location Alert Conditions
 */
export interface GeoLocationConditions {
  location: string;
  radius_km: number;
  country?: string;
}

/**
 * Inventory Restock Alert Conditions
 */
export interface InventoryRestockConditions {
  item_id: string;
  notify_on: "restock" | "new_listing" | "price_change";
  previous_status?: string;
}

/**
 * Custom Alert Conditions
 */
export interface CustomConditions {
  [key: string]: any;
}

/**
 * Listing to Evaluate
 */
export interface ListingToEvaluate {
  id?: string;
  marketplace: string;
  external_id: string;
  title: string;
  price: number | null;
  url: string;
  image_url?: string;
  location?: string;
  condition?: string;
  posted_at?: string;
  created_at?: string;
}

/**
 * Evaluation Result
 */
export interface EvaluationResult {
  triggered: boolean;
  trigger_reason?: string;
  matched_listing?: ListingToEvaluate;
  metadata?: Record<string, any>;
}

/**
 * Alert Notification (to be created)
 */
export interface AlertNotification {
  id?: string;
  alert_rule_id: string;
  user_id: string;
  trigger_type: string;
  trigger_reason?: string;
  listing_id?: string;
  marketplace?: string;
  listing_title?: string;
  listing_price?: number;
  listing_url?: string;
  listing_location?: string;
  status: "PENDING" | "SENT" | "FAILED" | "DISMISSED";
  sent_at?: string;
  failed_at?: string;
  failure_reason?: string;
  created_at?: string;
}
