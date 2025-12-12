import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/deals/[id]
 * Fetch a single deal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createServerClient();

    // Fetch deal from deal_scores
    const { data, error } = await supabase
      .from("deal_scores")
      .select(
        `
        *,
        listing:listings_raw (
          id,
          title,
          price,
          description,
          image_url,
          location,
          marketplace,
          url,
          captured_at
        )
      `
      )
      .eq("user_id", user.id)
      .or(`deal_id.eq.${id},id.eq.${id}`)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    // Transform to match frontend expectations
    const deal = {
      id: data.deal_id || data.id,
      title: data.listing?.title || "Untitled Deal",
      marketplace: data.marketplace || data.listing?.marketplace,
      buyPrice: parseFloat(data.listing?.price || 0),
      sellPrice: data.estimated_profit
        ? parseFloat(data.listing?.price || 0) + parseFloat(data.estimated_profit)
        : null,
      profit: data.estimated_profit ? parseFloat(data.estimated_profit) : null,
      margin: data.estimated_roi ? parseFloat(data.estimated_roi) : null,
      status: data.confidence_level === "very_high" || data.confidence_level === "high" ? "active" : "pending",
      score: data.adjusted_score,
      confidence: data.ai_confidence,
      description: data.listing?.description,
      imageUrl: data.listing?.image_url,
      location: data.listing?.location,
      buyUrl: data.listing?.url,
      sellUrl: null, // Would come from a separate table
      createdAt: data.created_at,
      updatedAt: data.created_at,
      // Additional deal score details
      rawScore: data.raw_score,
      profitScore: data.profit_score,
      riskScore: data.risk_score,
      velocityScore: data.velocity_score,
      marketScore: data.market_score,
      aiReasoning: data.ai_reasoning,
      confidenceLevel: data.confidence_level,
    };

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Error in /api/deals/[id]:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
