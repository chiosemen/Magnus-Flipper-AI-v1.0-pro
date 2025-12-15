/**
 * Feature Flags for Hybrid Ingestion System
 * 
 * Controls rollout of hybrid Apify + Local ingestion architecture.
 * All flags default to false (safe, rollback-ready).
 */

export const FEATURE_FLAGS = {
  /**
   * HYBRID_INGEST_DB_WRITE
   * 
   * When true: Worker writes IngestRun and Listing records to database.
   * When false: Worker operates in shadow mode (no DB writes).
   * 
   * Default: false (shadow mode)
   */
  HYBRID_INGEST_DB_WRITE: process.env.HYBRID_INGEST_DB_WRITE === "true",

  /**
   * HYBRID_INGEST_READ
   * 
   * When true: System reads from IngestRun/Listing tables (for dashboards, ROI).
   * When false: New tables exist but are not queried.
   * 
   * Default: false (tables unused)
   */
  HYBRID_INGEST_READ: process.env.HYBRID_INGEST_READ === "true",

  /**
   * HYBRID_INGEST_ADAPTIVE_ROUTING
   * 
   * When true: Router uses ROI/health metrics to adaptively choose strategies.
   * When false: Router uses registry config only (no adaptive decisions).
   * 
   * Default: false (config-only routing)
   */
  HYBRID_INGEST_ADAPTIVE_ROUTING: process.env.HYBRID_INGEST_ADAPTIVE_ROUTING === "true",
} as const;

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Log current feature flag state (for debugging)
 */
export function logFeatureFlags(): void {
  console.log("🔧 Feature Flags:", {
    HYBRID_INGEST_DB_WRITE: FEATURE_FLAGS.HYBRID_INGEST_DB_WRITE,
    HYBRID_INGEST_READ: FEATURE_FLAGS.HYBRID_INGEST_READ,
    HYBRID_INGEST_ADAPTIVE_ROUTING: FEATURE_FLAGS.HYBRID_INGEST_ADAPTIVE_ROUTING,
  });
}

