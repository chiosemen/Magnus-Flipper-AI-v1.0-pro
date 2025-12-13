import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { PerformanceSnapshot, PerformanceSummary } from "@magnus-flipper-ai/core/types/scraper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/scraper/performance
 * Get scraper performance metrics for all marketplaces or a specific marketplace
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const marketplace = searchParams.get("marketplace");
    const timeWindow = searchParams.get("timeWindow") || "24h"; // 1h, 6h, 24h, 7d

    const supabase = await createSupabaseServer();

    // Calculate time window
    const now = new Date();
    let startTime: Date;
    switch (timeWindow) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "6h":
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Query scraper_logs or scrape_runs table
    let query = supabase
      .from("scraper_logs")
      .select("*")
      .gte("started_at", startTime.toISOString())
      .order("started_at", { ascending: false });

    if (marketplace) {
      query = query.eq("marketplace", marketplace);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("Error fetching scraper logs:", error);
      // Fallback to empty data
      return NextResponse.json({
        summary: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          avgDuration: 0,
          avgListingsPerRun: 0,
          avgSuccessRate: 0,
          marketplaces: [],
        },
        snapshots: [],
      });
    }

    // Process logs into snapshots
    const snapshots: PerformanceSnapshot[] = (logs || []).map((log: any) => {
      const successRate = log.total_scraped > 0 ? log.total_scraped / (log.total_scraped + (log.errors || 0)) : 0;
      const errorRate = log.errors ? log.errors / (log.total_scraped + log.errors) : 0;

      return {
        marketplace: log.marketplace || "unknown",
        timestamp: log.started_at || new Date().toISOString(),
        metrics: {
          marketplace: log.marketplace || "unknown",
          timestamp: new Date(log.started_at || Date.now()).getTime(),
          duration: log.duration_ms || 0,
          listingsFound: log.total_scraped || 0,
          listingsSaved: log.total_scraped || 0,
          requestsMade: log.requests_made || 0,
          rateLimitHits: log.rate_limit_hits || 0,
          errors: log.errors || 0,
        },
        health: {
          status: log.success ? "healthy" : errorRate > 0.5 ? "down" : "degraded",
          successRate,
          avgLatency: log.duration_ms || 0,
          errorRate,
        },
      };
    });

    // Calculate summary
    const successfulRuns = snapshots.filter((s) => s.health.status === "healthy").length;
    const totalRuns = snapshots.length;
    const avgDuration =
      snapshots.reduce((sum, s) => sum + s.metrics.duration, 0) / totalRuns || 0;
    const avgListingsPerRun =
      snapshots.reduce((sum, s) => sum + s.metrics.listingsSaved, 0) / totalRuns || 0;
    const avgSuccessRate =
      snapshots.reduce((sum, s) => sum + s.health.successRate, 0) / totalRuns || 0;

    const summary: PerformanceSummary = {
      totalRuns,
      successfulRuns,
      failedRuns: totalRuns - successfulRuns,
      avgDuration,
      avgListingsPerRun,
      avgSuccessRate,
      marketplaces: Array.from(new Set(snapshots.map((s) => s.marketplace))),
    };

    return NextResponse.json(
      {
        summary,
        snapshots: marketplace ? snapshots : snapshots.slice(0, 100), // Limit to 100 for all marketplaces
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/scraper/performance:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
