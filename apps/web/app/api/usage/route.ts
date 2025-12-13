import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { getUserUsageStats } from "@magnus-flipper-ai/core/tiers/tier-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/usage
 * Get user's current usage and tier limits
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getUserUsageStats(user.id);
    if (!stats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      tier: stats.tier,
      limits: {
        maxSavedSearches: stats.limits.features.maxSavedSearches,
        maxActiveAlerts: stats.limits.features.maxActiveAlerts,
        emailAlerts: stats.limits.features.emailAlerts,
        inAppAlerts: stats.limits.features.inAppAlerts,
        marketplaces: stats.limits.features.marketplaces,
      },
      usage: stats.usage,
      upgradeAvailable: stats.tier === "free",
    });
  } catch (error: any) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage", message: error.message },
      { status: 500 }
    );
  }
}
