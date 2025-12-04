/**
 * Agentic Engine Types
 * Auto-Buyer and Auto-Lister operation types
 */

import { z } from "zod";

// =============================================================================
// AUTO-BUYER TYPES
// =============================================================================

export const BuyOpportunitySchema = z.object({
  id: z.string(),
  listing_id: z.string(),
  marketplace: z.string(),
  link: z.string(),
  title: z.string(),
  current_price: z.number(),
  estimated_resale_price: z.number(),
  estimated_roi: z.number(),
  risk_score: z.number().min(0).max(100),
  seller_rating: z.number().optional(),
  seller_reviews_count: z.number().optional(),
  confidence_score: z.number().min(0).max(100),
  created_at: z.string(),
});

export type BuyOpportunity = z.infer<typeof BuyOpportunitySchema>;

export const BuyExecutionConfigSchema = z.object({
  max_buy_price: z.number(),
  min_roi_percent: z.number(),
  min_seller_rating: z.number().optional(),
  min_seller_reviews: z.number().optional(),
  max_risk_score: z.number(),
  auto_approve: z.boolean().default(false),
  require_manual_review: z.boolean().default(true),
});

export type BuyExecutionConfig = z.infer<typeof BuyExecutionConfigSchema>;

export const BuyExecutionResultSchema = z.object({
  opportunity_id: z.string(),
  success: z.boolean(),
  order_id: z.string().optional(),
  confirmation_number: z.string().optional(),
  amount_paid: z.number().optional(),
  error: z.string().optional(),
  executed_at: z.string(),
  execution_duration_ms: z.number(),
  screenshots: z.array(z.string()).optional(),
});

export type BuyExecutionResult = z.infer<typeof BuyExecutionResultSchema>;

// =============================================================================
// AUTO-LISTER TYPES
// =============================================================================

export const ListingDraftSchema = z.object({
  id: z.string(),
  inventory_item_id: z.string(),
  marketplace: z.enum(["ebay", "vinted", "depop", "facebook", "gumtree", "poshmark"]),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string().optional(),
  condition: z.string(),
  images: z.array(z.string()),
  shipping_price: z.number().optional(),
  quantity: z.number().default(1),
  tags: z.array(z.string()).optional(),
  auto_generated: z.boolean().default(true),
  created_at: z.string(),
});

export type ListingDraft = z.infer<typeof ListingDraftSchema>;

export const MarketplaceAccountSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  marketplace: z.string(),
  account_username: z.string(),
  account_email: z.string().optional(),
  cookies: z.any().optional(),
  session_data: z.any().optional(),
  is_verified: z.boolean().default(false),
  last_used_at: z.string().optional(),
  created_at: z.string(),
});

export type MarketplaceAccount = z.infer<typeof MarketplaceAccountSchema>;

export const ListingExecutionResultSchema = z.object({
  draft_id: z.string(),
  marketplace: z.string(),
  success: z.boolean(),
  listing_url: z.string().optional(),
  listing_id: z.string().optional(),
  error: z.string().optional(),
  executed_at: z.string(),
  execution_duration_ms: z.number(),
});

export type ListingExecutionResult = z.infer<typeof ListingExecutionResultSchema>;

// =============================================================================
// RISK & SAFETY TYPES
// =============================================================================

export const RiskAssessmentSchema = z.object({
  item_id: z.string(),
  operation_type: z.enum(["buy", "list", "relist"]),
  risk_score: z.number().min(0).max(100),
  risk_factors: z.array(z.object({
    factor: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    description: z.string(),
  })),
  recommendation: z.enum(["proceed", "review", "reject"]),
  assessed_at: z.string(),
});

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export const BanRiskSchema = z.object({
  marketplace: z.string(),
  account_id: z.string(),
  risk_level: z.enum(["low", "medium", "high", "critical"]),
  recent_actions_count: z.number(),
  last_action_at: z.string(),
  cooldown_until: z.string().optional(),
  should_throttle: z.boolean(),
});

export type BanRisk = z.infer<typeof BanRiskSchema>;

// =============================================================================
// QUEUE & SCHEDULING TYPES
// =============================================================================

export const QueuedOperationSchema = z.object({
  id: z.string(),
  operation_type: z.enum(["buy", "list", "relist", "price_update"]),
  status: z.enum(["pending", "processing", "completed", "failed", "cancelled"]),
  priority: z.number().default(5),
  payload: z.any(),
  scheduled_for: z.string().optional(),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  error: z.string().optional(),
  retry_count: z.number().default(0),
  max_retries: z.number().default(3),
  created_at: z.string(),
});

export type QueuedOperation = z.infer<typeof QueuedOperationSchema>;

// =============================================================================
// HUMANIZATION TYPES
// =============================================================================

export interface TypingPattern {
  min_delay_ms: number;
  max_delay_ms: number;
  error_rate: number;
  correction_delay_ms: number;
}

export interface MousePattern {
  move_duration_ms: number;
  pause_before_click_ms: number;
  pause_after_click_ms: number;
  use_bezier_curve: boolean;
}

export interface BrowserBehavior {
  typing: TypingPattern;
  mouse: MousePattern;
  scroll_speed_px_per_second: number;
  pause_between_actions_ms: [number, number];
  simulate_tab_switches: boolean;
  random_page_scroll: boolean;
}

// =============================================================================
// TELEMETRY TYPES
// =============================================================================

export interface AutoBuyerMetrics {
  total_opportunities_identified: number;
  total_purchases_attempted: number;
  total_purchases_successful: number;
  total_purchases_failed: number;
  success_rate: number;
  avg_execution_time_ms: number;
  total_amount_spent: number;
  avg_roi: number;
}

export interface AutoListerMetrics {
  total_listings_created: number;
  total_listings_successful: number;
  total_listings_failed: number;
  success_rate: number;
  avg_execution_time_ms: number;
  active_listings_count: number;
  total_relists: number;
}

export interface SafetyMetrics {
  total_risk_assessments: number;
  high_risk_operations_blocked: number;
  accounts_in_cooldown: number;
  ban_incidents: number;
}
