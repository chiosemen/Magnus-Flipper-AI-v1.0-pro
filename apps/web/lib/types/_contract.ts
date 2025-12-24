/**
 * WEB CONTRACT VERSION
 * 
 * This version tracks the stability of the web contract surface.
 * Bump this when making intentional breaking changes to types.
 * 
 * Version History:
 * 
 * v1.0.0 – 2025-12-23 – Initial contract lock
 * - Stabilized post-build hardening
 * - Feed pagination with AggregatedListing
 * - Nullable field handling (title, price, imageUrl, location, url)
 * - Scraper performance metrics
 * - Compliance risk scoring
 * - Operator telemetry types
 * - Contract boundary enforcement via TypeScript path mapping
 * 
 * Breaking Change Policy:
 * - Minor version bump: New optional fields, new types
 * - Major version bump: Required field changes, type removals
 * - Patch version: Documentation, internal refactors
 */

export const WEB_CONTRACT_VERSION = "1.0.0";

export const WEB_CONTRACT_METADATA = {
  version: WEB_CONTRACT_VERSION,
  lastUpdated: "2025-12-23",
  description: "Magnus Flipper Web UI Contract Surface",
  maintainer: "Magnus Flipper Team",
} as const;

/**
 * Contract Stability Levels
 * 
 * STABLE: Production-ready, breaking changes require major version bump
 * BETA: In use but may change, breaking changes require minor version bump
 * EXPERIMENTAL: May change without notice, not for production use
 */
export type ContractStability = "STABLE" | "BETA" | "EXPERIMENTAL";

export const CONTRACT_STABILITY: Record<string, ContractStability> = {
  feed: "STABLE",
  scraper: "STABLE",
  compliance: "STABLE",
  operator: "BETA",
  marketplace: "BETA",
} as const;

