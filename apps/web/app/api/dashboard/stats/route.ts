import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/dashboard/stats
 * Fetch dashboard statistics for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Fetch user's deal counts
    const { data: dealsData, error: dealsError } = await supabase
      .from("deal_scores")
      .select("id, estimated_profit, confidence_level, created_at")
      .eq("user_id", user.id);

    if (dealsError) {
      console.error("Error fetching deals:", dealsError);
    }

    // Calculate stats
    const deals = dealsData || [];
    const activeDeals = deals.filter(
      (d) => d.confidence_level === "high" || d.confidence_level === "very_high"
    ).length;

    const totalProfit = deals.reduce((sum, deal) => {
      return sum + (deal.estimated_profit ? parseFloat(deal.estimated_profit.toString()) : 0);
    }, 0);

    // Fetch marketplace status (from scraper_health or similar)
    const { data: marketplaceData } = await supabase
      .from("scraper_health")
      .select("marketplace, status, last_seen")
      .order("last_seen", { ascending: false });

    const marketplaces = (marketplaceData || []).map((m: any) => ({
      name: m.marketplace,
      status: m.status === "healthy" ? "live" : m.status === "degraded" ? "warming" : "offline",
      lastSeen: m.last_seen,
    }));

    // Get unique marketplaces
    const uniqueMarketplaces = Array.from(
      new Set(marketplaces.map((m) => m.name))
    ).map((name) => {
      const latest = marketplaces
        .filter((m) => m.name === name)
        .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())[0];
      return latest;
    });

    return NextResponse.json(
      {
        stats: {
          activeDeals,
          totalDeals: deals.length,
          monthlyROI: totalProfit, // This month's profit
          alerts: 0, // Would come from alerts table
        },
        marketplaces: uniqueMarketplaces,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/dashboard/stats:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        stats: {
          activeDeals: 0,
          totalDeals: 0,
          monthlyROI: 0,
          alerts: 0,
        },
        marketplaces: [],
      },
      { status: 500 }
    );
  }
}
