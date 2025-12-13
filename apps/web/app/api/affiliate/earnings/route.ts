import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";
import type { EarningsPeriod, EarningsDataPoint } from "@magnus-flipper-ai/core/types/affiliate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/affiliate/earnings
 * Fetch affiliate earnings data for a specific period
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "7d") as EarningsPeriod;

    const supabase = await createSupabaseServer();

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // TODO: Replace with real query when affiliate_earnings table exists
    // For now, return mock structure

    const earningsData: EarningsDataPoint[] = [];
    const totalEarnings = earningsData.reduce((sum, point) => sum + point.earnings, 0);
    const totalClicks = earningsData.reduce((sum, point) => sum + point.clicks, 0);
    const totalConversions = earningsData.reduce((sum, point) => sum + point.conversions, 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return NextResponse.json(
      {
        earningsData,
        metrics: [
          {
            label: "Total Earnings",
            value: `$${totalEarnings.toFixed(2)}`,
            change: null,
            changeType: "neutral",
          },
          {
            label: "This Period",
            value: `$${totalEarnings.toFixed(2)}`,
            change: null,
            changeType: "neutral",
          },
          {
            label: "Avg. Daily",
            value: `$${(totalEarnings / Math.max(1, period === "7d" ? 7 : period === "30d" ? 30 : 90)).toFixed(2)}`,
            change: null,
            changeType: "neutral",
          },
          {
            label: "Pending",
            value: "$0.00",
            change: null,
            changeType: "neutral",
          },
        ],
        topPerformers: {
          links: [],
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/affiliate/earnings:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        earningsData: [],
        metrics: [],
      },
      { status: 500 }
    );
  }
}
