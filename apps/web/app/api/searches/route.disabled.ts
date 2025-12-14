// DISABLED: This route imports backend-only modules (@magnus-flipper-ai/core/db, tier-service)
// and breaks Next.js build. MM v1 does NOT need this route.
// Temporarily disabled for v1 deployment.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@magnus-flipper-ai/core/db";
import { getUser } from "@/lib/supabase/server";
import { canCreateSearch, canAccessMarketplace } from "@magnus-flipper-ai/core/tiers/tier-service";
import { formatLimitError, getUserTier, getTierLimits } from "@magnus-flipper-ai/core/tiers/tier-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/searches
 * Create a new Facebook search
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      keywords,
      minPrice,
      maxPrice,
      maxDistanceMiles,
      condition,
      marketplace = "facebook",
    } = body;

    // Validate marketplace
    if (marketplace !== "facebook" && marketplace !== "vinted") {
      return NextResponse.json(
        { error: "Only Facebook and Vinted marketplaces are supported" },
        { status: 400 }
      );
    }

    // ✅ TIER CHECK 1: Check if user has reached max saved searches
    const searchCheck = await canCreateSearch(user.id);
    if (!searchCheck.allowed) {
      const tier = getUserTier({ subscription: null, role: undefined });
      const errorResponse = formatLimitError("MAX_SEARCHES_REACHED", tier);
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // ✅ STEP 2: Enforce 10 active search limit (TODAY-ONLY guard)
    const activeSearchesCount = await prisma.savedSearch.count({
      where: {
        userId: user.id,
        isActive: true,
        marketplace: marketplace.toLowerCase(),
      },
    });

    if (activeSearchesCount >= 10) {
      return NextResponse.json(
        {
          error: "Maximum active searches reached",
          message: `You have reached the maximum of 10 active ${marketplace} searches. Please deactivate an existing search before creating a new one.`,
          limit: 10,
          current: activeSearchesCount,
        },
        { status: 403 }
      );
    }

    // ✅ TIER CHECK 2: Check if user can access this marketplace
    const marketplaceCheck = await canAccessMarketplace(user.id, marketplace);
    if (!marketplaceCheck.allowed) {
      const tier = getUserTier({ subscription: null, role: undefined });
      const errorResponse = formatLimitError("MARKETPLACE_NOT_ALLOWED", tier);
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Validate required fields
    if (!name || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "Name and keywords array are required" },
        { status: 400 }
      );
    }

    // Create search query from keywords
    const query = keywords.join(" ");

    // Store filters in JSON field
    const filters = {
      keywords,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      maxDistanceMiles: maxDistanceMiles ? parseFloat(maxDistanceMiles) : undefined,
      condition: condition && Array.isArray(condition) ? condition : undefined,
    };

    // Create saved search
    const search = await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name,
        query,
        marketplace: marketplace.toLowerCase(),
        filters: filters as any,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: search.id,
      name: search.name,
      query: search.query,
      marketplace: search.marketplace,
      filters: search.filters,
      isActive: search.isActive,
      createdAt: search.createdAt.toISOString(),
      updatedAt: search.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error creating search:", error);
    return NextResponse.json(
      { error: "Failed to create search", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/searches?marketplace=facebook
 * Get active Facebook searches for the user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const marketplace = searchParams.get("marketplace") || "facebook";

    if (marketplace !== "facebook" && marketplace !== "vinted") {
      return NextResponse.json(
        { error: "Only Facebook and Vinted marketplaces are supported" },
        { status: 400 }
      );
    }

    const searches = await prisma.savedSearch.findMany({
      where: {
        userId: user.id,
        marketplace: marketplace.toLowerCase(),
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      searches.map((search) => ({
        id: search.id,
        name: search.name,
        query: search.query,
        marketplace: search.marketplace,
        filters: search.filters,
        isActive: search.isActive,
        createdAt: search.createdAt.toISOString(),
        updatedAt: search.updatedAt.toISOString(),
        // Performance stats preview
        stats: {
          totalMatchesFound: search.totalMatchesFound,
          totalListingsScanned: search.totalListingsScanned,
          lastRunAt: search.lastRunAt?.toISOString() || null,
        },
      }))
    );
  } catch (error: any) {
    console.error("Error fetching searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch searches", message: error.message },
      { status: 500 }
    );
  }
}
