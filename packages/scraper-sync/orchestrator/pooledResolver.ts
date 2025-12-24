/**
 * Phase 1: Pooled Resolver
 *
 * Core pooling logic for multi-source scraper results.
 * CRITICAL: This is control-plane only - no scraper behavior changes.
 */

import type {
  ScrapeSource,
  SourcedScrapeResult,
  ResolvedScrapeResult,
  ZeroResultsAnomaly,
} from "../types/pooling.js";

/**
 * Resolve pooled scraper results using fallback strategy
 *
 * Strategy (Phase 1):
 * 1. Prefer Apify if it has items
 * 2. Fall back to DIY if Apify empty
 * 3. Mark degraded if both empty
 * 4. Never merge items (Phase 2+)
 *
 * @param results - Array of sourced scrape results to resolve
 * @returns Resolved result with winning source
 */
export function resolvePooledResult(
  results: SourcedScrapeResult[]
): ResolvedScrapeResult {
  if (results.length === 0) {
    throw new Error("resolvePooledResult: No results provided");
  }

  // Separate by source
  const apifyResults = results.filter((r) => r.source === "apify");
  const diyResults = results.filter((r) => r.source === "diy");

  // Phase 1 Resolution Logic:
  // 1. Prefer Apify always if it has items
  const apifyWithItems = apifyResults.find((r) => r.listings.length > 0);
  if (apifyWithItems) {
    return {
      source: "apify",
      result: apifyWithItems,
      isDegraded: false,
      allResults: results,
    };
  }

  // 2. Fall back to DIY if it has items
  const diyWithItems = diyResults.find((r) => r.listings.length > 0);
  if (diyWithItems) {
    return {
      source: "diy",
      result: diyWithItems,
      isDegraded: false,
      allResults: results,
    };
  }

  // 3. Both empty - marketplace is degraded
  // Use first available result (preferring apify)
  const fallbackResult = apifyResults[0] || diyResults[0] || results[0];

  return {
    source: fallbackResult.source,
    result: fallbackResult,
    isDegraded: true,
    allResults: results,
  };
}

/**
 * Detect zero-results anomalies
 *
 * An anomaly is when:
 * - Scraper returns zero items
 * - No exception was thrown (errors array is empty)
 * - Either success=true OR success=false (silent failure)
 *
 * This catches two patterns:
 * 1. Scraper succeeds but returns nothing (success=true, items=0)
 * 2. Scraper fails silently without exceptions (success=false, items=0, errors=[])
 *
 * This is observability, not error handling.
 * The job should NOT fail - just log the anomaly.
 *
 * @param result - Sourced scrape result to check
 * @returns Anomaly object if detected, null otherwise
 */
export function detectZeroResultsAnomaly(
  result: SourcedScrapeResult
): ZeroResultsAnomaly | null {
  // Detect zero items with no actual errors (silent failure)
  if (result.listings.length === 0 && result.errors.length === 0) {
    return {
      type: "ZERO_RESULTS",
      source: result.source,
      marketplace: result.marketplace,
      query: result.query,
      timestamp: new Date().toISOString(),
      duration_ms: result.duration_ms,
      errors: result.errors,
    };
  }

  return null;
}

/**
 * Log anomaly to console (structured)
 *
 * Phase 1: Console logging only
 * Phase 2+: Could write to telemetry DB
 *
 * @param anomaly - Anomaly to log
 */
export function logAnomaly(anomaly: ZeroResultsAnomaly): void {
  console.warn("[ANOMALY] Zero-results detected:", {
    type: anomaly.type,
    source: anomaly.source,
    marketplace: anomaly.marketplace,
    query: anomaly.query || "N/A",
    timestamp: anomaly.timestamp,
    duration_ms: anomaly.duration_ms,
    error_count: anomaly.errors.length,
  });

  // Persist to database if Supabase is available
  persistAnomalyToDB(anomaly).catch((error) => {
    console.error("[ANOMALY] Failed to persist to DB:", error);
  });
}

/**
 * Persist anomaly to Supabase (non-blocking)
 */
async function persistAnomalyToDB(anomaly: ZeroResultsAnomaly): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // Silently skip if Supabase not configured (e.g., in test environments)
    return;
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.from("scrape_anomalies").insert({
      type: anomaly.type,
      severity: "medium", // Default severity, can be escalated later
      marketplace: anomaly.marketplace,
      source: anomaly.source,
      query: anomaly.query || null,
      duration_ms: anomaly.duration_ms,
      error_count: anomaly.errors.length,
      metadata: { errors: anomaly.errors },
    });

    if (error) {
      console.error("[ANOMALY] DB write error:", error);
    }
  } catch (error) {
    // Non-blocking - don't throw, just log
    console.error("[ANOMALY] Error persisting to DB:", error);
  }
}

/**
 * Check all results for anomalies and log them
 *
 * @param results - Array of sourced results to check
 */
export function detectAndLogAnomalies(results: SourcedScrapeResult[]): void {
  for (const result of results) {
    const anomaly = detectZeroResultsAnomaly(result);
    if (anomaly) {
      logAnomaly(anomaly);
    }
  }
}
