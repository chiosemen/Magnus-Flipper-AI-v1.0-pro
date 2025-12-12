import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { getMarketplaceProfile, getAllMarketplaceIds } from "@magnus-flipper-ai/marketplace-config";
import { getGuardrails, applyGuardrails } from "@magnus-flipper-ai/compliance-shield/guardrails";
import type { GuardrailStatus } from "@magnus-flipper-ai/core/types/compliance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/compliance/guardrails
 * Get guardrails for all marketplaces or a specific marketplace
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const marketplace = searchParams.get("marketplace");
    const proposedMultiplier = searchParams.get("multiplier")
      ? parseFloat(searchParams.get("multiplier")!)
      : undefined;
    const successRate = searchParams.get("successRate")
      ? parseFloat(searchParams.get("successRate")!)
      : undefined;

    // Get marketplace IDs
    const marketplaceIds = marketplace
      ? [marketplace]
      : getAllMarketplaceIds();

    // Get guardrails for each marketplace
    const guardrails: GuardrailStatus[] = marketplaceIds.map((id) => {
      const profile = getMarketplaceProfile(id);
      const guardrail = getGuardrails(profile);

      let violations: any[] = [];
      let emergencyMode = false;
      let currentMultiplier = proposedMultiplier;

      // If proposed multiplier provided, validate it
      if (proposedMultiplier !== undefined && successRate !== undefined) {
        const result = applyGuardrails(
          profile,
          proposedMultiplier,
          successRate,
          {},
          false
        );
        violations = result.violations;
        emergencyMode = result.emergencyMode;
        currentMultiplier = result.multiplier;
      }

      return {
        marketplace: id,
        guardrail,
        currentMultiplier,
        violations,
        emergencyMode,
      };
    });

    return NextResponse.json(
      {
        guardrails: marketplace ? guardrails[0] : guardrails,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/compliance/guardrails:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compliance/guardrails/validate
 * Validate a proposed throttle multiplier
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { marketplace, multiplier, successRate, metrics = {}, isEmergencyMode = false } = body;

    if (!marketplace || multiplier === undefined || successRate === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: marketplace, multiplier, successRate" },
        { status: 400 }
      );
    }

    const profile = getMarketplaceProfile(marketplace);
    const result = applyGuardrails(profile, multiplier, successRate, metrics, isEmergencyMode);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in /api/compliance/guardrails/validate:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
