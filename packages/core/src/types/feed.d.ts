/**
 * Feed Types
 *
 * Shared TypeScript types for feed and real-time data
 * Used across web and mobile platforms
 */
import type { AggregatedListing } from "@magnus-flipper-ai/feed-engine";
/**
 * Feed Query Parameters
 */
export interface FeedQueryParams {
    marketplaces?: string;
    limit?: string;
    cursor?: string;
    minPrice?: string;
    maxPrice?: string;
    deduplicate?: string;
    rank?: string;
}
/**
 * Feed Response
 */
export interface FeedResponse {
    listings: AggregatedListing[];
    pagination: {
        limit: number;
        hasMore: boolean;
        nextCursor?: string;
        total?: number;
    };
    metadata: {
        marketplaces: string[];
        deduplicated: boolean;
        ranked: boolean;
    };
}
/**
 * Realtime SSE Event Types
 */
export type RealtimeEventType = "connected" | "listings" | "heartbeat" | "error" | "closed";
/**
 * Realtime SSE Event
 */
export interface RealtimeEvent {
    type: RealtimeEventType;
    timestamp: string;
    listings?: AggregatedListing[];
    count?: number;
    pollCount?: number;
    error?: string;
    message?: string;
}
/**
 * WebSocket Message Types
 */
export type WebSocketMessageType = "subscribe" | "unsubscribe" | "connected" | "subscribed" | "listings" | "heartbeat" | "error";
/**
 * WebSocket Client Message (to server)
 */
export interface WebSocketClientMessage {
    type: "subscribe" | "unsubscribe";
    marketplaces?: string[];
}
/**
 * WebSocket Server Message (from server)
 */
export interface WebSocketServerMessage {
    type: "connected" | "subscribed" | "listings" | "heartbeat" | "error";
    timestamp: string;
    listings?: AggregatedListing[];
    count?: number;
    error?: string;
    message?: string;
}
/**
 * Feed Filter State
 */
export interface FeedFilters {
    marketplaces: string[];
    minPrice?: number;
    maxPrice?: number;
}
/**
 * Feed View Mode
 */
export type FeedViewMode = "paginated" | "realtime" | "hybrid";
/**
 * Feed Connection Status
 */
export type FeedConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
//# sourceMappingURL=feed.d.ts.map