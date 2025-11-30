/**
 * Search Performance Analytics API
 * GET /api/analytics/search-performance
 *
 * Track search execution metrics: query speed, success rate, error analytics per marketplace
 *
 * Query params:
 * - marketplace: Filter by marketplace (optional)
 * - savedSearchId: Filter by specific saved search (optional)
 * - days: Number of days to look back (default: 7)
 * - sortBy: 'fastest' | 'slowest' | 'most_reliable' | 'most_errors' (default: 'most_reliable')
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchPerfQuery {
  marketplace?: string;
  savedSearchId?: string;
  days?: number;
  sortBy?: 'fastest' | 'slowest' | 'most_reliable' | 'most_errors';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: SearchPerfQuery = {
      marketplace: searchParams.get('marketplace') || undefined,
      savedSearchId: searchParams.get('savedSearchId') || undefined,
      days: parseInt(searchParams.get('days') || '7'),
      sortBy: (searchParams.get('sortBy') as any) || 'most_reliable',
    };

    // Build the query
    let dbQuery = supabase
      .from('search_performance')
      .select(`
        *,
        saved_searches(id, category, manufacturer, models, sites)
      `)
      .gte('executed_at', new Date(Date.now() - (query.days! * 24 * 60 * 60 * 1000)).toISOString())
      .order('executed_at', { ascending: false });

    if (query.marketplace) {
      dbQuery = dbQuery.eq('marketplace', query.marketplace);
    }

    if (query.savedSearchId) {
      dbQuery = dbQuery.eq('saved_search_id', query.savedSearchId);
    }

    const { data: performance, error } = await dbQuery;

    if (error) {
      console.error('[Search Performance API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch search performance', details: error.message },
        { status: 500 }
      );
    }

    // Group by marketplace
    const marketplaceStats = new Map<string, any>();

    const MARKETPLACES = ['VINTED', 'EBAY', 'GUMTREE', 'CRAIGSLIST', 'OFFERUP', 'FB_MARKETPLACE'];

    MARKETPLACES.forEach(mp => {
      marketplaceStats.set(mp, {
        marketplace: mp,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalResults: 0,
        totalNewResults: 0,
        executionTimes: [],
        errors: [],
        avgExecutionTime: 0,
        minExecutionTime: Infinity,
        maxExecutionTime: -Infinity,
        successRate: 0,
        avgResultsPerSearch: 0,
        avgNewResultsPerSearch: 0,
      });
    });

    // Populate marketplace stats
    performance?.forEach((perf: any) => {
      const marketplace = perf.marketplace;
      if (!marketplaceStats.has(marketplace)) return;

      const stats = marketplaceStats.get(marketplace);
      stats.totalExecutions++;

      if (perf.success) {
        stats.successfulExecutions++;
      } else {
        stats.failedExecutions++;
        stats.errors.push({
          message: perf.error_message,
          executedAt: perf.executed_at,
        });
      }

      stats.totalResults += perf.results_count || 0;
      stats.totalNewResults += perf.new_results_count || 0;

      const execTime = perf.execution_time_ms || 0;
      stats.executionTimes.push(execTime);
      stats.minExecutionTime = Math.min(stats.minExecutionTime, execTime);
      stats.maxExecutionTime = Math.max(stats.maxExecutionTime, execTime);
    });

    // Calculate aggregates
    const analysis = Array.from(marketplaceStats.values())
      .map((stats) => {
        if (stats.totalExecutions === 0) {
          stats.minExecutionTime = 0;
          stats.maxExecutionTime = 0;
          return stats;
        }

        // Calculate average execution time
        const sum = stats.executionTimes.reduce((acc: number, time: number) => acc + time, 0);
        stats.avgExecutionTime = Math.round(sum / stats.executionTimes.length);

        // Calculate median execution time
        const sortedTimes = [...stats.executionTimes].sort((a, b) => a - b);
        const mid = Math.floor(sortedTimes.length / 2);
        stats.medianExecutionTime = sortedTimes.length % 2 === 0
          ? (sortedTimes[mid - 1] + sortedTimes[mid]) / 2
          : sortedTimes[mid];

        // Calculate success rate
        stats.successRate = Math.round((stats.successfulExecutions / stats.totalExecutions) * 10000) / 100;

        // Calculate average results per search
        stats.avgResultsPerSearch = Math.round((stats.totalResults / stats.totalExecutions) * 100) / 100;
        stats.avgNewResultsPerSearch = Math.round((stats.totalNewResults / stats.totalExecutions) * 100) / 100;

        // Calculate performance score (lower is better)
        // Score = (avg_execution_time_ms / 1000) + ((100 - success_rate) * 10)
        stats.performanceScore = Math.round(
          (stats.avgExecutionTime / 1000) + ((100 - stats.successRate) * 10)
        );

        // Keep only recent errors (max 10)
        stats.recentErrors = stats.errors.slice(0, 10);
        delete stats.errors;
        delete stats.executionTimes;

        return stats;
      })
      .filter(stats => stats.totalExecutions > 0); // Only include marketplaces with data

    // Sort based on sortBy parameter
    switch (query.sortBy) {
      case 'fastest':
        analysis.sort((a, b) => a.avgExecutionTime - b.avgExecutionTime);
        break;
      case 'slowest':
        analysis.sort((a, b) => b.avgExecutionTime - a.avgExecutionTime);
        break;
      case 'most_reliable':
        analysis.sort((a, b) => b.successRate - a.successRate);
        break;
      case 'most_errors':
        analysis.sort((a, b) => b.failedExecutions - a.failedExecutions);
        break;
      default:
        analysis.sort((a, b) => a.performanceScore - b.performanceScore);
    }

    // Calculate overall summary
    const totalPerformance = performance || [];
    const summary = {
      totalSearches: totalPerformance.length,
      successfulSearches: totalPerformance.filter((p: any) => p.success).length,
      failedSearches: totalPerformance.filter((p: any) => !p.success).length,
      overallSuccessRate: totalPerformance.length > 0
        ? Math.round((totalPerformance.filter((p: any) => p.success).length / totalPerformance.length) * 10000) / 100
        : 0,
      avgExecutionTime: totalPerformance.length > 0
        ? Math.round(totalPerformance.reduce((acc: number, p: any) => acc + (p.execution_time_ms || 0), 0) / totalPerformance.length)
        : 0,
      fastestMarketplace: analysis.length > 0
        ? analysis.reduce((min, curr) => curr.avgExecutionTime < min.avgExecutionTime ? curr : min)
        : null,
      slowestMarketplace: analysis.length > 0
        ? analysis.reduce((max, curr) => curr.avgExecutionTime > max.avgExecutionTime ? curr : max)
        : null,
      mostReliableMarketplace: analysis.length > 0
        ? analysis.reduce((max, curr) => curr.successRate > max.successRate ? curr : max)
        : null,
      leastReliableMarketplace: analysis.length > 0
        ? analysis.reduce((min, curr) => curr.successRate < min.successRate ? curr : min)
        : null,
    };

    return NextResponse.json({
      success: true,
      query,
      summary,
      analysis,
      totalMarketplaces: analysis.length,
    });
  } catch (error) {
    console.error('[Search Performance API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/search-performance
 * Record a new search execution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      savedSearchId,
      marketplace,
      executionTimeMs,
      resultsCount,
      newResultsCount,
      success,
      errorMessage,
    } = body;

    if (!savedSearchId || !marketplace || executionTimeMs === undefined || success === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: savedSearchId, marketplace, executionTimeMs, success' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('search_performance')
      .insert({
        saved_search_id: savedSearchId,
        marketplace,
        execution_time_ms: executionTimeMs,
        results_count: resultsCount || 0,
        new_results_count: newResultsCount || 0,
        success,
        error_message: errorMessage || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Search Performance API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to record search performance', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Search Performance API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
