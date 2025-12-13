import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";
import type { AffiliateLink } from "@/types/affiliate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/affiliate/links
 * Fetch user's affiliate links
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServer();

    // TODO: Replace with real query when affiliate_links table exists
    // For now, return empty array with metrics structure

    const links: AffiliateLink[] = [];

    // Calculate metrics from links
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
    const totalConversions = links.reduce((sum, link) => sum + link.conversions, 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return NextResponse.json(
      {
        links,
        metrics: {
          totalClicks: {
            label: "Total Clicks",
            value: totalClicks.toLocaleString(),
          },
          conversionRate: {
            label: "Conversion Rate",
            value: `${conversionRate.toFixed(2)}%`,
          },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/affiliate/links:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        links: [],
        metrics: {
          totalClicks: { label: "Total Clicks", value: "0" },
          conversionRate: { label: "Conversion Rate", value: "0%" },
        },
      },
      { status: 500 }
    );
  }
}
