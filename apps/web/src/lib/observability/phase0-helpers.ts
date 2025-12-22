/**
 * Phase 0 Observability Helpers
 *
 * MISSION: Measure reality, NOT improve it
 * CONSTRAINT: ZERO optimizations allowed
 *
 * These helpers make it easier to add instrumentation WITHOUT changing logic.
 */

import { recordLatency, incrementCounter, recordGauge } from './metrics';
import { logInfo, logError } from './logger';

/**
 * Classify scraper errors for metrics
 *
 * Maps error messages to standard error types for consistent tracking
 *
 * NO LOGIC CHANGE: Just categorization for metrics
 */
export function classifyScraperError(error: any): string {
  const msg = error?.message || String(error);
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('timeout')) return 'timeout';
  if (lowerMsg.includes('rate limit') || lowerMsg.includes('rate-limit') || lowerMsg.includes('429')) return 'rate_limit';
  if (lowerMsg.includes('network') || lowerMsg.includes('econnrefused') || lowerMsg.includes('enotfound')) return 'network';
  if (lowerMsg.includes('parse') || lowerMsg.includes('json') || lowerMsg.includes('invalid')) return 'parse';
  if (lowerMsg.includes('auth') || lowerMsg.includes('401') || lowerMsg.includes('403')) return 'auth';

  return 'unknown';
}

/**
 * Classify database errors for metrics
 *
 * Maps database error messages to standard error codes
 *
 * NO LOGIC CHANGE: Just categorization for metrics
 */
export function classifyDbError(error: any): string {
  const msg = error?.message || error?.msg || String(error);
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('timeout') || lowerMsg.includes('timed out')) return 'timeout';
  if (lowerMsg.includes('connection') || lowerMsg.includes('connect')) return 'connection_lost';
  if (lowerMsg.includes('constraint') || lowerMsg.includes('violates')) return 'constraint_violation';
  if (lowerMsg.includes('duplicate') || lowerMsg.includes('unique')) return 'duplicate_key';
  if (lowerMsg.includes('deadlock')) return 'deadlock';

  return 'unknown';
}

/**
 * Instrument a Supabase query
 *
 * Wraps a Supabase query to automatically record:
 * - Query duration
 * - Rows affected (if applicable)
 * - Errors
 *
 * NO LOGIC CHANGE: Just wraps existing query with metrics
 *
 * @example
 * const result = await instrumentedQuery(
 *   'select',
 *   'scraped_listings',
 *   () => supabase.from('scraped_listings').select('*').eq('marketplace', 'facebook')
 * );
 */
export async function instrumentedQuery<T>(
  operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete',
  table: string,
  queryFn: () => Promise<{ data: T | null; error: any; count?: number | null }>
): Promise<{ data: T | null; error: any; count?: number | null }> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    // Record query duration (NO LOGIC CHANGE)
    recordLatency(`db_query_duration_ms{operation="${operation}",table="${table}"}`, duration);

    // Record rows affected if available (NO LOGIC CHANGE)
    if (result.count !== null && result.count !== undefined) {
      incrementCounter(`db_rows_affected_total{operation="${operation}",table="${table}"}`, result.count);
    }

    // Record error if present (NO LOGIC CHANGE)
    if (result.error) {
      const errorCode = classifyDbError(result.error);
      incrementCounter(`db_errors_total{operation="${operation}",table="${table}",error_code="${errorCode}"}`, 1);

      logError(`Database ${operation} failed`, {
        module: 'instrumentedQuery',
        operation,
        table,
        error: result.error,
        duration: Math.round(duration),
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    // Record exception metrics (NO LOGIC CHANGE)
    recordLatency(`db_query_duration_ms{operation="${operation}",table="${table}"}`, duration);

    const errorCode = classifyDbError(error);
    incrementCounter(`db_errors_total{operation="${operation}",table="${table}",error_code="${errorCode}"}`, 1);

    logError(`Database ${operation} exception`, {
      module: 'instrumentedQuery',
      operation,
      table,
      error: error instanceof Error ? error : String(error),
      duration: Math.round(duration),
    });

    throw error;
  }
}

/**
 * Instrument a scraper operation
 *
 * Wraps scraper execution to automatically record:
 * - Execution duration
 * - Listings found
 * - Success/failure
 * - Errors
 *
 * NO LOGIC CHANGE: Just wraps existing scraper with metrics
 *
 * @example
 * const result = await instrumentedScraper(
 *   'facebook',
 *   () => facebookScraper.scrape()
 * );
 */
export async function instrumentedScraper<T extends { success: boolean; listings: any[]; error?: string }>(
  marketplace: string,
  scraperFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await scraperFn();
    const duration = performance.now() - start;

    // Record scraper metrics (NO LOGIC CHANGE)
    recordLatency(`scraper_execution_duration_ms{marketplace="${marketplace}",success="${result.success}"}`, duration);
    incrementCounter(`scraper_listings_found_total{marketplace="${marketplace}"}`, result.listings.length);

    // Record success/failure (NO LOGIC CHANGE)
    if (!result.success) {
      const errorType = classifyScraperError(result.error || 'unknown');
      incrementCounter(`scraper_errors_total{marketplace="${marketplace}",error_type="${errorType}"}`, 1);
    }

    logInfo(`Scraper ${marketplace} completed`, {
      module: 'instrumentedScraper',
      marketplace,
      success: result.success,
      listingsFound: result.listings.length,
      duration: Math.round(duration),
    });

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    // Record exception metrics (NO LOGIC CHANGE)
    recordLatency(`scraper_execution_duration_ms{marketplace="${marketplace}",success="false"}`, duration);

    const errorType = classifyScraperError(error);
    incrementCounter(`scraper_errors_total{marketplace="${marketplace}",error_type="${errorType}"}`, 1);

    logError(`Scraper ${marketplace} exception`, {
      module: 'instrumentedScraper',
      marketplace,
      error: error instanceof Error ? error : String(error),
      duration: Math.round(duration),
    });

    throw error;
  }
}

/**
 * Record rate limit metrics
 *
 * Call this after tryConsume() to record rate limit state
 *
 * NO LOGIC CHANGE: Just records metrics
 *
 * @example
 * const result = await tryConsume({ marketplace: 'facebook', tier: 'PRO' });
 * recordRateLimitMetrics('facebook', 'PRO', result);
 */
export function recordRateLimitMetrics(
  marketplace: string,
  tier: string,
  result: { allowed: boolean; remaining: number; burstRemaining?: number }
): void {
  try {
    // Record hit if blocked (NO LOGIC CHANGE)
    if (!result.allowed) {
      // Determine if burst or rate limit
      const limitType = result.burstRemaining !== undefined && result.burstRemaining === 0 ? 'burst' : 'rate';
      incrementCounter(`rate_limit_hits_total{marketplace="${marketplace}",tier="${tier}",limit_type="${limitType}"}`, 1);
    }

    // Record remaining tokens (NO LOGIC CHANGE)
    recordGauge(`rate_limit_remaining{marketplace="${marketplace}",tier="${tier}"}`, result.remaining);

  } catch (error) {
    // Fail-safe: never crash on metrics errors
    console.error('[METRICS ERROR] Failed to record rate limit metrics:', error);
  }
}

/**
 * Record ingestion metrics
 *
 * Call this after ingest() to record ingestion results
 *
 * NO LOGIC CHANGE: Just records metrics
 *
 * @example
 * const stats = await ingestion.ingest(listings);
 * recordIngestionMetrics('upsert', stats);
 */
export function recordIngestionMetrics(
  stage: 'normalize' | 'upsert' | 'mark_stale',
  stats: { inserted?: number; updated?: number; skipped?: number; errors?: number; duration?: number } | number
): void {
  try {
    // Handle duration (passed as number)
    if (typeof stats === 'number') {
      recordLatency(`ingestion_duration_ms{stage="${stage}"}`, stats);
      return;
    }

    // Handle stats object
    if (stats.duration !== undefined) {
      recordLatency(`ingestion_duration_ms{stage="${stage}"}`, stats.duration);
    }

    if (stats.inserted !== undefined) {
      incrementCounter('ingestion_listings_total{result="inserted"}', stats.inserted);
    }

    if (stats.updated !== undefined) {
      incrementCounter('ingestion_listings_total{result="updated"}', stats.updated);
    }

    if (stats.skipped !== undefined) {
      incrementCounter('ingestion_listings_total{result="skipped"}', stats.skipped);
    }

    if (stats.errors !== undefined) {
      incrementCounter('ingestion_listings_total{result="error"}', stats.errors);
    }

  } catch (error) {
    // Fail-safe: never crash on metrics errors
    console.error('[METRICS ERROR] Failed to record ingestion metrics:', error);
  }
}
