import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/deals
 * Fetch user's deals/arbitrage opportunities
 * Returns deals from deal_scores table joined with listings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status") || undefined;

    // Build query for deal_scores
    let query = supabase
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
      .order("adjusted_score", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      // For now, we'll use a simple status filter
      // You can extend this based on your business logic
      if (status === "active") {
        // Active deals (recently created, high confidence)
        query = query.gte("ai_confidence", 0.7);
      } else if (status === "sold") {
        // This would require a separate tracking table
        // For now, we'll skip this filter
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching deals:", error);
      return NextResponse.json(
        { error: "Failed to fetch deals", message: error.message },
        { status: 500 }
      );
    }

    // Transform data to match our frontend expectations
    const deals = (data || []).map((deal: any) => ({
      id: deal.deal_id || deal.id,
      title: deal.listing?.title || "Untitled Deal",
      marketplace: deal.marketplace || deal.listing?.marketplace,
      buyPrice: parseFloat(deal.listing?.price || 0),
      sellPrice: deal.estimated_profit
        ? parseFloat(deal.listing?.price || 0) + parseFloat(deal.estimated_profit)
        : null,
      profit: deal.estimated_profit ? parseFloat(deal.estimated_profit) : null,
      margin: deal.estimated_roi ? parseFloat(deal.estimated_roi) : null,
      status: deal.confidence_level === "very_high" || deal.confidence_level === "high" ? "active" : "pending",
      score: deal.adjusted_score,
      confidence: deal.ai_confidence,
      description: deal.listing?.description,
      imageUrl: deal.listing?.image_url,
      location: deal.listing?.location,
      buyUrl: deal.listing?.url,
      createdAt: deal.created_at,
      updatedAt: deal.created_at,
    }));

    return NextResponse.json(
      {
        deals,
        pagination: {
          limit,
          offset,
          hasMore: deals.length === limit,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/deals:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        deals: [],
        pagination: {
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      },
      { status: 500 }
    );
  }
}
