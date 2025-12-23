/**
 * Conversion Tracking Types
 * 
 * Event schema for tracking user conversion paths through the marketing funnel.
 */

export type ConversionEventType =
  | "page_view"
  | "primary_cta_click"
  | "secondary_link_click"
  | "form_submit"
  | "api_success"
  | "api_failure";

export interface ConversionEvent {
  pathId: string; // UUID for this event
  fromPage: string; // Source page path
  toPage: string | null; // Destination page path (null for page_view)
  eventType: ConversionEventType;
  timestamp: number; // Unix timestamp in milliseconds
  sessionId: string; // Session identifier
  anonUserId: string; // Anonymous user identifier
  metadata?: Record<string, unknown>; // Additional event data
}

export interface ConversionPath {
  sessionId: string;
  events: ConversionEvent[];
  startTime: number;
  endTime?: number;
}

export interface ClickTrackingParams {
  source: string;
  target: string;
  intent: "primary" | "secondary" | "footer" | "header";
}

export interface ConversionTrackingParams {
  type: "scan_started" | "lead_submitted" | "offer_received";
  value?: number;
  metadata?: Record<string, unknown>;
}

