import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@magnus-flipper-ai/core";
import {
  aggregateListings,
  calculateMarketplaceAvgPrices,
  type AggregatedListing,
} from "@magnus-flipper-ai/feed-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface FeedQueryParams {
  marketplaces?: string; // Comma-separated list
  limit?: string;
  cursor?: string; // Base64 encoded cursor
  minPrice?: string;
  maxPrice?: string;
  deduplicate?: string;
  rank?: string;
}

interface FeedResponse {
  listings: AggregatedListing[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
  metadata: {
    marketplaces: string[];
    deduplicated: boolean;
    ranked: boolean;
  };
}

interface FeedListing {
  id: string;
  title: string;
  price: number;
  url?: string;
}

/**
 * GET /api/search/feed
 * Returns ranked, deduped, marketplace-merged feed with cursor-based pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: FeedQueryParams = {
      marketplaces: searchParams.get("marketplaces") || undefined,
      limit: searchParams.get("limit") || "50",
      cursor: searchParams.get("cursor") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      deduplicate: searchParams.get("deduplicate") || "true",
      rank: searchParams.get("rank") || "true",
    };

    // Parse marketplaces filter
    const marketplaceFilter = params.marketplaces
      ? params.marketplaces.split(",").map((m) => m.trim().toLowerCase())
      : undefined;

    // Parse pagination
    const limit = Math.min(parseInt(params.limit || "50", 10), 100); // Max 100
    let offset = 0;

    // Parse cursor (base64 encoded JSON: { offset, lastId })
    if (params.cursor) {
      try {
        const cursorData = JSON.parse(
          Buffer.from(params.cursor, "base64").toString("utf-8")
        );
        offset = cursorData.offset || 0;
      } catch {
        // Invalid cursor, start from beginning
        offset = 0;
      }
    }

    // Build Prisma query
    const where: any = {
      isActive: true,
    };

    if (marketplaceFilter && marketplaceFilter.length > 0) {
      where.marketplace = {
        in: marketplaceFilter,
      };
    }

    if (params.minPrice) {
      where.price = {
        ...where.price,
        gte: parseFloat(params.minPrice),
      };
    }

    if (params.maxPrice) {
      where.price = {
        ...where.price,
        lte: parseFloat(params.maxPrice),
      };
    }

    // Optimized: Use cursor-based query if cursor provided
    let listings;
    if (params.cursor && offset > 0) {
      // Cursor-based pagination: fetch from cursor position
      try {
        const cursorData = JSON.parse(
          Buffer.from(params.cursor, "base64").toString("utf-8")
        );
        
        // Use cursor to optimize query
        listings = await prisma.listing.findMany({
          where: {
            ...where,
            // Optimize: only fetch listings after cursor timestamp
            lastSeen: {
              lte: cursorData.lastSeen ? new Date(cursorData.lastSeen) : undefined,
            },
          },
          orderBy: [
            { lastSeen: "desc" },
            { firstSeen: "desc" },
          ],
          take: limit * 3, // Fetch more for better deduplication
        });
      } catch {
        // Fallback to standard query
        listings = await prisma.listing.findMany({
          where,
          orderBy: [
            { lastSeen: "desc" },
            { firstSeen: "desc" },
          ],
          take: limit * 2,
        });
      }
    } else {
      // First page: standard query
      listings = await prisma.listing.findMany({
        where,
        orderBy: [
          { lastSeen: "desc" },
          { firstSeen: "desc" },
        ],
        take: limit * 2, // Fetch extra for deduplication
      });
    }

    // Transform to feed engine format
    const feedListings = listings.map((listing: FeedListing) => ({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      marketplace: listing.marketplace,
      firstSeen: listing.firstSeen,
      lastSeen: listing.lastSeen,
      description: listing.description || undefined,
      imageUrl: listing.imageUrl || undefined,
      location: listing.location || undefined,
      sellerId: (listing.metadata as any)?.sellerId,
      sellerName: (listing.metadata as any)?.sellerName,
      viewsCount: (listing.metadata as any)?.viewsCount,
      url: listing.url, // Include URL for navigation
    }));

    // Calculate marketplace averages for ranking
    const marketplaceAvgPrices = calculateMarketplaceAvgPrices(feedListings);

    // Aggregate (deduplicate + rank)
    const aggregated = aggregateListings(feedListings, {
      deduplicate: params.deduplicate !== "false",
      deduplicationThreshold: "normal",
      rank: params.rank !== "false",
      marketplaceAvgPrices,
      limit: limit + 1, // Fetch one extra to determine hasMore
      offset: 0, // We'll handle pagination after aggregation
    });

    // Determine if there are more results
    const hasMore = aggregated.length > limit;
    const paginated = hasMore ? aggregated.slice(0, limit) : aggregated;

    // Generate next cursor
    let nextCursor: string | undefined;
    if (hasMore && paginated.length > 0) {
      const lastItem = paginated[paginated.length - 1];
      const cursorData = {
        offset: offset + limit,
        lastId: lastItem.id,
        lastSeen: lastItem.lastSeen.toISOString(),
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
    }

    // Get total count (approximate, for large datasets)
    const totalCount = await prisma.listing.count({
      where,
    });

    const response: FeedResponse = {
      listings: paginated,
      pagination: {
        limit,
        hasMore,
        nextCursor,
        total: totalCount,
      },
      metadata: {
        marketplaces: marketplaceFilter || [],
        deduplicated: params.deduplicate !== "false",
        ranked: params.rank !== "false",
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in /api/search/feed:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch feed",
        message: error instanceof Error ? error.message : "Unknown error",
        listings: [],
        pagination: {
          limit: 50,
          hasMore: false,
        },
        metadata: {
          marketplaces: [],
          deduplicated: false,
          ranked: false,
        },
      },
      { status: 500 }
    );
  }
}
