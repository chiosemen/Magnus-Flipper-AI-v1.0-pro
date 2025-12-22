/**
 * Metrics Export Endpoint
 *
 * PHASE 0 OBSERVABILITY: Export all collected metrics for baseline analysis
 *
 * Usage:
 *   GET /api/metrics → Returns JSON with counters, latencies, gauges
 *
 * Baseline Collection:
 *   */5 * * * * curl https://app.example.com/api/metrics > /data/metrics-$(date +\%s).json
 */

import { NextResponse } from 'next/server';
import { getAllMetrics } from '@/lib/observability/metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/metrics
 *
 * Returns all metrics collected since server start
 *
 * Response Format:
 * {
 *   timestamp: "2025-12-22T10:30:00.000Z",
 *   metrics: {
 *     counters: { "scraper_listings_found_total{marketplace=\"facebook\"}": 1234, ... },
 *     latencies: { "scraper_execution_duration_ms{marketplace=\"facebook\",success=\"true\"}": { count, avg, min, max, p50, p95, p99 }, ... },
 *     gauges: { "rate_limit_remaining{marketplace=\"facebook\",tier=\"all\"}": 85, ... }
 *   }
 * }
 */
export async function GET() {
  try {
    const metrics = getAllMetrics();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      metrics,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[METRICS API] Failed to export metrics:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
