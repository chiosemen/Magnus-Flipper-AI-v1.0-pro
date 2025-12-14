import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { getMarketplaceProfile, getAllMarketplaceIds } from "@magnus-flipper-ai/marketplace-config";
import { calculateRiskScore, compareRiskScores } from "@magnus-flipper-ai/compliance-shield/riskScoring";
import type { MarketplaceRisk } from "@magnus-flipper-ai/core/types/compliance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/compliance/risk-scores
 * Get risk scores for all marketplaces
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const marketplace = searchParams.get("marketplace");

    // Get all marketplace IDs
    const marketplaceIds = getAllMarketplaceIds();

    // Calculate risk scores
    const scores: MarketplaceRisk[] = marketplaceIds
      .map((id) => {
        const profile = getMarketplaceProfile(id);
        const score = calculateRiskScore(profile);
        return {
          marketplace: id,
          score,
          rank: 0, // Will be set after comparison
        };
      })
      .filter((item) => !marketplace || item.marketplace === marketplace);

    // Compare and rank scores
    const ranked = compareRiskScores(
      scores.map((item) => ({ marketplace: item.marketplace, score: item.score }))
    );

    // Merge ranks back
    const rankedScores = scores.map((item) => {
      const rankedItem = ranked.find((r) => r.marketplace === item.marketplace);
      return {
        ...item,
        rank: rankedItem?.rank || 0,
      };
    });

    // Sort by rank
    rankedScores.sort((a, b) => a.rank - b.rank);

    // Calculate summary
    const summary = {
      total: rankedScores.length,
      critical: rankedScores.filter((s) => s.score.complianceLevel === "critical").length,
      highRisk: rankedScores.filter((s) => s.score.complianceLevel === "high-risk").length,
      caution: rankedScores.filter((s) => s.score.complianceLevel === "caution").length,
      safe: rankedScores.filter((s) => s.score.complianceLevel === "safe").length,
    };

    return NextResponse.json(
      {
        summary,
        marketplaceRisks: rankedScores,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/compliance/risk-scores:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
