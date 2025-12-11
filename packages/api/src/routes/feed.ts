/**
 * Feed API Routes
 * /api/search/feed - Ranked, deduped, marketplace-merged feed
 */

import express, { Request, Response } from "express";
import { prisma } from "@magnus-flipper-ai/core/db";
import {
  aggregateListings,
  calculateMarketplaceAvgPrices,
  type AggregatedListing,
} from "@magnus-flipper-ai/feed-engine";

const feedRouter = express.Router();

interface FeedQuery {
  marketplaces?: string;
  limit?: string;
  cursor?: string;
  minPrice?: string;
  maxPrice?: string;
  deduplicate?: string;
  rank?: string;
}

/**
 * GET /api/search/feed
 * Returns ranked, deduped, marketplace-merged feed with cursor-based pagination
 */
feedRouter.get("/feed", async (req: Request<{}, {}, {}, FeedQuery>, res: Response) => {
  try {
    const {
      marketplaces,
      limit = "50",
      cursor,
      minPrice,
      maxPrice,
      deduplicate = "true",
      rank = "true",
    } = req.query;

    // Parse marketplaces filter
    const marketplaceFilter = marketplaces
      ? marketplaces.split(",").map((m) => m.trim().toLowerCase())
      : undefined;

    // Parse pagination
    const limitNum = Math.min(parseInt(limit, 10), 100);
    let offset = 0;

    // Parse cursor
    if (cursor) {
      try {
        const cursorData = JSON.parse(
          Buffer.from(cursor, "base64").toString("utf-8")
        );
        offset = cursorData.offset || 0;
      } catch {
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

    if (minPrice) {
      where.price = {
        ...where.price,
        gte: parseFloat(minPrice),
      };
    }

    if (maxPrice) {
      where.price = {
        ...where.price,
        lte: parseFloat(maxPrice),
      };
    }

    // Fetch listings
    const listings = await prisma.listing.findMany({
      where,
      orderBy: [
        { lastSeen: "desc" },
        { firstSeen: "desc" },
      ],
      take: limitNum * 2, // Fetch extra for deduplication
    });

    // Transform to feed format
    const feedListings = listings.map((listing) => ({
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
    }));

    // Calculate marketplace averages
    const marketplaceAvgPrices = calculateMarketplaceAvgPrices(feedListings);

    // Aggregate
    const aggregated = aggregateListings(feedListings, {
      deduplicate: deduplicate !== "false",
      deduplicationThreshold: "normal",
      rank: rank !== "false",
      marketplaceAvgPrices,
      limit: limitNum + 1,
      offset: 0,
    });

    // Pagination
    const hasMore = aggregated.length > limitNum;
    const paginated = hasMore ? aggregated.slice(0, limitNum) : aggregated;

    // Generate next cursor
    let nextCursor: string | undefined;
    if (hasMore && paginated.length > 0) {
      const lastItem = paginated[paginated.length - 1];
      const cursorData = {
        offset: offset + limitNum,
        lastId: lastItem.id,
        lastSeen: lastItem.lastSeen.toISOString(),
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
    }

    // Get total count
    const totalCount = await prisma.listing.count({ where });

    res.json({
      listings: paginated,
      pagination: {
        limit: limitNum,
        hasMore,
        nextCursor,
        total: totalCount,
      },
      metadata: {
        marketplaces: marketplaceFilter || [],
        deduplicated: deduplicate !== "false",
        ranked: rank !== "false",
      },
    });
  } catch (error) {
    console.error("Error in /api/search/feed:", error);
    res.status(500).json({
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
    });
  }
});

export { feedRouter };
