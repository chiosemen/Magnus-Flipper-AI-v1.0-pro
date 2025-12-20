import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/deals
 * Fetch pooled deals from public.scraped_listings
 * Supports optional searchId filter with ownership enforcement
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const user = await getUser();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const marketplace = searchParams.get("marketplace");
    const searchId = searchParams.get("searchId");

    // Build base query for pooled deals (search_id IS NULL)
    let query = supabase
      .from("scraped_listings")
      .select("*")
      .is("search_id", null) // Pooled deals only
      .eq("is_stale", false)
      .order("freshness_score", { ascending: false })
      .order("last_seen_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Optional marketplace filter
    if (marketplace) {
      query = query.eq("marketplace", marketplace);
    }

    // Optional searchId filter with ownership enforcement
    if (searchId) {
      // OWNERSHIP CHECK: Verify user owns this saved_search
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required for search-specific deals" },
          { status: 401 }
        );
      }

      const { data: savedSearch, error: searchError } = await supabase
        .from("saved_searches")
        .select("user_id")
        .eq("id", searchId)
        .single();

      if (searchError || !savedSearch) {
        return NextResponse.json(
          { error: "Saved search not found" },
          { status: 404 }
        );
      }

      if (savedSearch.user_id !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized access to saved search" },
          { status: 403 }
        );
      }

      // Override query to fetch search-specific deals
      query = supabase
        .from("scraped_listings")
        .select("*")
        .eq("search_id", searchId)
        .eq("is_stale", false)
        .order("freshness_score", { ascending: false })
        .order("last_seen_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (marketplace) {
        query = query.eq("marketplace", marketplace);
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

    // Transform to frontend format
    const deals = (data || []).map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      marketplace: listing.marketplace,
      buyPrice: parseFloat(listing.price || 0),
      location: listing.location,
      buyUrl: listing.link,
      imageUrl: listing.images?.[0] || null,
      description: listing.description,
      condition: listing.condition,
      sellerName: listing.seller_name,
      createdAt: listing.first_seen_at,
      updatedAt: listing.last_seen_at,
      freshnessScore: listing.freshness_score,
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
