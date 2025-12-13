import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { VelocityMetrics } from "@magnus-flipper-ai/core/types/scraper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/scraper/velocity
 * Get velocity metrics for listings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const marketplace = searchParams.get("marketplace");
    const timeWindow = searchParams.get("timeWindow") || "24h";

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

    // Query listings with velocity data
    // Note: Velocity scores are calculated in the feed-engine package
    // For now, we'll use first_seen_at and last_seen_at to estimate velocity
    let query = supabase
      .from("listings_raw")
      .select("marketplace, first_seen_at, last_seen_at")
      .gte("last_seen_at", startTime.toISOString())
      .order("last_seen_at", { ascending: false })
      .limit(1000);

    if (marketplace) {
      query = query.eq("marketplace", marketplace);
    }

    const { data: listings, error } = await query;

    if (error) {
      console.error("Error fetching velocity data:", error);
      return NextResponse.json({
        velocity: [],
      });
    }

    // Calculate velocity metrics per marketplace
    const marketplaceGroups = new Map<string, any[]>();
    (listings || []).forEach((listing: any) => {
      const mp = listing.marketplace || "unknown";
      if (!marketplaceGroups.has(mp)) {
        marketplaceGroups.set(mp, []);
      }
      marketplaceGroups.get(mp)!.push(listing);
    });

    const velocityMetrics: VelocityMetrics[] = Array.from(marketplaceGroups.entries()).map(
      ([mp, items]) => {
        // Calculate average time difference (velocity proxy)
        const velocities = items
          .filter((item) => item.first_seen_at && item.last_seen_at)
          .map((item) => {
            const firstSeen = new Date(item.first_seen_at).getTime();
            const lastSeen = new Date(item.last_seen_at).getTime();
            const hoursDiff = (lastSeen - firstSeen) / (1000 * 60 * 60);
            // Higher velocity = shorter time difference
            return hoursDiff > 0 ? 100 / (1 + hoursDiff) : 100;
          });

        const avgVelocity = velocities.length > 0
          ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
          : 0;

        // Group by hour for trend
        const trendMap = new Map<string, { sum: number; count: number }>();
        items.forEach((item) => {
          if (item.last_seen_at) {
            const date = new Date(item.last_seen_at);
            const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
            if (!trendMap.has(hourKey)) {
              trendMap.set(hourKey, { sum: 0, count: 0 });
            }
            const entry = trendMap.get(hourKey)!;
            entry.sum += avgVelocity;
            entry.count += 1;
          }
        });

        const velocityTrend = Array.from(trendMap.entries())
          .map(([key, data]) => ({
            timestamp: key,
            avgVelocity: data.count > 0 ? data.sum / data.count : 0,
            count: data.count,
          }))
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
          .slice(-24); // Last 24 hours

        return {
          marketplace: mp,
          avgVelocityScore: avgVelocity,
          topVelocityListings: velocities.filter((v) => v > 80).length,
          velocityTrend,
        };
      }
    );

    return NextResponse.json(
      {
        velocity: marketplace ? velocityMetrics[0] : velocityMetrics,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/scraper/velocity:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
