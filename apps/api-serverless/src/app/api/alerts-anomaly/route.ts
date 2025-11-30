/**
 * Alerts Anomaly Radar API
 * GET /api/alerts-anomaly - Compute anomaly metrics for alert activity by marketplace
 *
 * Returns simple anomaly detection based on statistical analysis (not ML):
 * - Compares last 24h to 7-day average
 * - Flags SPIKE / DROP / NORMAL
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MarketplaceAnomaly {
  marketplace: string;
  total_alerts_last_24h: number;
  total_alerts_prev_24h: number;
  avg_alerts_per_day_last_7d: number;
  anomaly_score: number;
  anomaly_label: 'SPIKE' | 'DROP' | 'NORMAL';
}

/**
 * GET /api/alerts-anomaly
 * Public endpoint (no auth required for demo purposes)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Try to query saved_search_hits first, fall back to other tables
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const prev24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Try saved_search_hits first
    const { data: hitsData, error: hitsError } = await supabase
      .from('saved_search_hits')
      .select('marketplace, created_at')
      .gte('created_at', last7d.toISOString());

    // If saved_search_hits doesn't exist or is empty, try marketplace_listings
    let allData = hitsData;
    if (hitsError || !hitsData || hitsData.length === 0) {
      const { data: listingsData, error: listingsError } = await supabase
        .from('marketplace_listings')
        .select('marketplace, created_at')
        .gte('created_at', last7d.toISOString());

      if (!listingsError && listingsData) {
        allData = listingsData;
      }
    }

    // If no data found, return empty result
    if (!allData || allData.length === 0) {
      return NextResponse.json({
        byMarketplace: [],
        generated_at: now.toISOString(),
        note: 'No alert/listing data found in the last 7 days'
      });
    }

    // Group by marketplace and compute metrics
    const marketplaceMap = new Map<string, MarketplaceAnomaly>();

    // Process each record
    allData.forEach((record: any) => {
      const marketplace = record.marketplace || 'UNKNOWN';
      const createdAt = new Date(record.created_at);

      if (!marketplaceMap.has(marketplace)) {
        marketplaceMap.set(marketplace, {
          marketplace,
          total_alerts_last_24h: 0,
          total_alerts_prev_24h: 0,
          avg_alerts_per_day_last_7d: 0,
          anomaly_score: 0,
          anomaly_label: 'NORMAL'
        });
      }

      const metrics = marketplaceMap.get(marketplace)!;

      // Count by time period
      if (createdAt >= last24h) {
        metrics.total_alerts_last_24h++;
      } else if (createdAt >= prev24h) {
        metrics.total_alerts_prev_24h++;
      }
    });

    // Calculate anomaly scores
    const byMarketplace: MarketplaceAnomaly[] = [];

    marketplaceMap.forEach((metrics) => {
      // Calculate 7-day average from total count
      const totalLast7d = allData.filter(
        (r: any) => r.marketplace === metrics.marketplace
      ).length;

      metrics.avg_alerts_per_day_last_7d = totalLast7d / 7;

      // Calculate anomaly score
      const baseline = metrics.avg_alerts_per_day_last_7d;
      const current = metrics.total_alerts_last_24h;

      if (baseline > 0) {
        metrics.anomaly_score = (current - baseline) / (baseline + 1);
      } else {
        metrics.anomaly_score = current > 0 ? 1.0 : 0;
      }

      // Round anomaly score to 2 decimals
      metrics.anomaly_score = Math.round(metrics.anomaly_score * 100) / 100;

      // Determine label
      if (metrics.anomaly_score >= 1.0) {
        metrics.anomaly_label = 'SPIKE';
      } else if (metrics.anomaly_score <= -1.0) {
        metrics.anomaly_label = 'DROP';
      } else {
        metrics.anomaly_label = 'NORMAL';
      }

      // Round averages to 1 decimal
      metrics.avg_alerts_per_day_last_7d = Math.round(metrics.avg_alerts_per_day_last_7d * 10) / 10;

      byMarketplace.push(metrics);
    });

    // Sort by anomaly score (descending - spikes first)
    byMarketplace.sort((a, b) => b.anomaly_score - a.anomaly_score);

    return NextResponse.json({
      byMarketplace,
      generated_at: now.toISOString()
    });

  } catch (error: any) {
    console.error('Error in alerts-anomaly API:', error);
    return NextResponse.json(
      {
        error: 'Failed to compute anomaly metrics',
        byMarketplace: [],
        generated_at: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
