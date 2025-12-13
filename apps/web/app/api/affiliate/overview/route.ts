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
      metrics: {
        totalEarnings: 0,
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalLinks: 0,
        activeLinks: 0,
        totalCreatives: 0,
        activeCreatives: 0,
        pendingPayout: 0,
        paidOut: 0,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      },
      recentLinks: [],
      recentEarnings: [],
      topPerformers: {
        links: [],
        creatives: [],
      },
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
