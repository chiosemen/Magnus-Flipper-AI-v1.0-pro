import type { Tier, Strategy } from "@magnus-flipper-ai/ingest-registry";
import type { Marketplace } from "@magnus-flipper-ai/queue";

/**
 * Extended ScrapeJob payload with tier and traceId
 */
export interface IngestJobPayload {
  jobId: string;
  marketplace: Marketplace;
  query: string;
  region: string;
  page: number;
  batchSize: number;
  userId?: string;
  savedSearchId?: string;
  tier?: Tier; // User tier (defaults to "free")
  traceId?: string; // For observability
}

/**
 * Routing decision returned by router
 */
export interface RoutingDecision {
  strategy: Strategy;
  actorId?: string; // Required if strategy is "apify" or "hybrid"
  reason?: string; // Human-readable reason for decision
}

/**
 * Dependencies for router functions
 */
import type Redis from "ioredis";

export interface RouterDependencies {
  redis: Redis;
  prisma?: any; // PrismaClient (optional, for adaptive routing)
}

/**
 * Concurrency state per marketplace
 */
export interface MarketplaceConcurrencyState {
  current: number; // Current active runs
  max: number; // Max allowed concurrent runs
}

/**
 * Global concurrency state
 */
export interface GlobalConcurrencyState {
  apify: MarketplaceConcurrencyState;
  total: MarketplaceConcurrencyState;
}

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureAt?: Date;
  openedAt?: Date;
}

