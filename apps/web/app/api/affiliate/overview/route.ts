import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";
import type { AffiliateOverview } from "@/types/affiliate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/affiliate/overview
 * Fetch affiliate overview data including metrics, recent links, and top performers
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServer();

    // TODO: Replace with real queries when affiliate tables exist
    // For now, return mock structure matching AffiliateOverview type

    const overview: AffiliateOverview = {
      links: [],
      metrics: {
        totalClicks: { label: "Total Clicks", value: "0" },
        conversionRate: { label: "Conversion Rate", value: "0%" },
        totalEarnings: { label: "Total Earnings", value: "$0.00" },
        activeLinks: 0,
        totalLinks: 0,
      },
      recentActivity: [],
    };

    return NextResponse.json(overview, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in /api/affiliate/overview:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
