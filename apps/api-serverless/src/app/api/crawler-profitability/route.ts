/**
 * Crawler Profitability Heatmap API
 * GET /api/crawler-profitability - Compute profitability metrics by marketplace and search
 *
 * Returns aggregated analytics showing which marketplaces and searches
 * are driving the most value (hits, runs, estimated profit potential)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MarketplaceProfitability {
  marketplace: string;
  total_runs: number;
  total_hits: number;
  avg_hits_per_run: number;
  estimated_value_score: number;
}

interface SearchProfitability {
  search_id: string;
  label: string;
  marketplace: string;
  total_runs: number;
  total_hits: number;
  avg_hits_per_run: number;
  estimated_value_score: number;
}

/**
 * Calculate value score based on available metrics
 * Formula: (total_hits * 2) + (avg_hits_per_run * 5)
 */
function calculateValueScore(totalHits: number, avgHitsPerRun: number): number {
  return Math.round((totalHits * 2) + (avgHitsPerRun * 5) * 10) / 10;
}

/**
 * GET /api/crawler-profitability
 * Public endpoint (no auth required for demo purposes)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Try to query saved_search_runs first
    const { data: runsData, error: runsError } = await supabase
      .from('saved_search_runs')
      .select('*')
      .order('run_started_at', { ascending: false })
      .limit(1000);

    // Try to query saved_search_hits
    const { data: hitsData, error: hitsError } = await supabase
      .from('saved_search_hits')
      .select('*')
      .limit(5000);

    // If no data found, try marketplace_listings as fallback
    if ((!runsData || runsData.length === 0) && (!hitsData || hitsData.length === 0)) {
      const { data: listingsData, error: listingsError } = await supabase
        .from('marketplace_listings')
        .select('marketplace, created_at')
        .limit(1000);

      if (!listingsError && listingsData && listingsData.length > 0) {
        // Synthesize basic metrics from listings
        const marketplaceMap = new Map<string, MarketplaceProfitability>();

        listingsData.forEach((listing: any) => {
          const marketplace = listing.marketplace || 'UNKNOWN';
          if (!marketplaceMap.has(marketplace)) {
            marketplaceMap.set(marketplace, {
              marketplace,
              total_runs: 0,
              total_hits: 0,
              avg_hits_per_run: 0,
              estimated_value_score: 0
            });
          }
          const metrics = marketplaceMap.get(marketplace)!;
          metrics.total_hits++;
        });

        const byMarketplace: MarketplaceProfitability[] = [];
        marketplaceMap.forEach((metrics) => {
          metrics.avg_hits_per_run = metrics.total_runs > 0 ? metrics.total_hits / metrics.total_runs : 0;
          metrics.estimated_value_score = calculateValueScore(metrics.total_hits, metrics.avg_hits_per_run);
          byMarketplace.push(metrics);
        });

        return NextResponse.json({
          byMarketplace: byMarketplace.sort((a, b) => b.estimated_value_score - a.estimated_value_score),
          bySearch: [],
          generated_at: new Date().toISOString(),
          note: 'Limited data - computed from marketplace_listings only'
        });
      }

      return NextResponse.json({
        byMarketplace: [],
        bySearch: [],
        generated_at: new Date().toISOString(),
        note: 'No profitability data available yet'
      });
    }

    // Process runs data
    const marketplaceRunsMap = new Map<string, { runs: number; totalHits: number }>();
    const searchRunsMap = new Map<string, {
      searchId: string;
      marketplace: string;
      runs: number;
      totalHits: number;
      label?: string;
    }>();

    if (runsData && runsData.length > 0) {
      runsData.forEach((run: any) => {
        const marketplace = run.marketplace || 'UNKNOWN';
        const searchId = run.saved_search_id || 'unknown';
        const newResults = run.new_results || 0;
        const totalResults = run.total_results || 0;

        // Update marketplace aggregates
        if (!marketplaceRunsMap.has(marketplace)) {
          marketplaceRunsMap.set(marketplace, { runs: 0, totalHits: 0 });
        }
        const mData = marketplaceRunsMap.get(marketplace)!;
        mData.runs++;
        mData.totalHits += totalResults;

        // Update search aggregates
        const searchKey = `${searchId}_${marketplace}`;
        if (!searchRunsMap.has(searchKey)) {
          searchRunsMap.set(searchKey, {
            searchId,
            marketplace,
            runs: 0,
            totalHits: 0,
            label: `Search ${searchId.substring(0, 8)}`
          });
        }
        const sData = searchRunsMap.get(searchKey)!;
        sData.runs++;
        sData.totalHits += totalResults;
      });
    }

    // If we have hits data, enhance the metrics
    if (hitsData && hitsData.length > 0) {
      hitsData.forEach((hit: any) => {
        const marketplace = hit.marketplace || 'UNKNOWN';

        if (!marketplaceRunsMap.has(marketplace)) {
          marketplaceRunsMap.set(marketplace, { runs: 1, totalHits: 0 });
        }
        const mData = marketplaceRunsMap.get(marketplace)!;
        mData.totalHits++;
      });
    }

    // Build marketplace profitability array
    const byMarketplace: MarketplaceProfitability[] = [];
    marketplaceRunsMap.forEach((data, marketplace) => {
      const avgHitsPerRun = data.runs > 0 ? data.totalHits / data.runs : 0;
      byMarketplace.push({
        marketplace,
        total_runs: data.runs,
        total_hits: data.totalHits,
        avg_hits_per_run: Math.round(avgHitsPerRun * 10) / 10,
        estimated_value_score: calculateValueScore(data.totalHits, avgHitsPerRun)
      });
    });

    // Build search profitability array
    const bySearch: SearchProfitability[] = [];
    searchRunsMap.forEach((data) => {
      const avgHitsPerRun = data.runs > 0 ? data.totalHits / data.runs : 0;
      bySearch.push({
        search_id: data.searchId,
        label: data.label || `Search ${data.searchId}`,
        marketplace: data.marketplace,
        total_runs: data.runs,
        total_hits: data.totalHits,
        avg_hits_per_run: Math.round(avgHitsPerRun * 10) / 10,
        estimated_value_score: calculateValueScore(data.totalHits, avgHitsPerRun)
      });
    });

    // Sort by value score (descending)
    byMarketplace.sort((a, b) => b.estimated_value_score - a.estimated_value_score);
    bySearch.sort((a, b) => b.estimated_value_score - a.estimated_value_score);

    return NextResponse.json({
      byMarketplace,
      bySearch: bySearch.slice(0, 20), // Top 20 searches
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in crawler-profitability API:', error);
    return NextResponse.json(
      {
        error: 'Failed to compute profitability metrics',
        byMarketplace: [],
        bySearch: [],
        generated_at: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
