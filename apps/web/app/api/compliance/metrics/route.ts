import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { getMarketplaceProfile, getAllMarketplaceIds } from "@magnus-flipper-ai/marketplace-config";
import { buildComplianceSnapshot } from "@magnus-flipper-ai/compliance-shield/observability";
import type { ComplianceSnapshot } from "@magnus-flipper-ai/core/types/compliance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/compliance/metrics
 * Get compliance metrics and snapshots for all marketplaces
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const marketplace = searchParams.get("marketplace");

    // Get marketplace IDs
    const marketplaceIds = marketplace
      ? [marketplace]
      : getAllMarketplaceIds();

    // Build snapshots for each marketplace
    const snapshots: ComplianceSnapshot[] = marketplaceIds.map((id) => {
      const profile = getMarketplaceProfile(id);
      // TODO: Get real metrics from database/observability system
      const metrics = {
        successRate: 0.95, // Placeholder
        avgLatencyMs: 500, // Placeholder
        errorRate: 0.05, // Placeholder
        requestsPerMinute: 10, // Placeholder
      };
      return buildComplianceSnapshot(profile, 1.0, metrics, false);
    });

    return NextResponse.json(
      {
        snapshots: marketplace ? snapshots[0] : snapshots,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/compliance/metrics:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
