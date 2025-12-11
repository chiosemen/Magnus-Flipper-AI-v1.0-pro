/**
 * Realtime Feed Routes
 * SSE and WebSocket endpoints for real-time feed updates
 */

import express, { Request, Response } from "express";
import { prisma } from "@magnus-flipper-ai/core/db";
import {
  aggregateListings,
  calculateMarketplaceAvgPrices,
} from "@magnus-flipper-ai/feed-engine";

const realtimeRouter = express.Router();

/**
 * GET /api/search/realtime
 * Server-Sent Events (SSE) stream for real-time feed updates
 */
realtimeRouter.get("/realtime", async (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const marketplaces = req.query.marketplaces
    ? (req.query.marketplaces as string).split(",").map((m) => m.trim().toLowerCase())
    : undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 50);

  // Send initial connection
  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  let lastSeenIds = new Set<string>();
  let pollCount = 0;
  const maxPolls = 120; // 10 minutes
  let lastPollTime = new Date(Date.now() - 5 * 60 * 1000); // Start 5 minutes ago

  // Track last poll timestamp for incremental updates
  let lastPollTime = new Date(Date.now() - 5 * 60 * 1000); // Start 5 minutes ago

  const pollInterval = setInterval(async () => {
    try {
      pollCount++;

      const where: any = {
        isActive: true,
      };

      if (marketplaces && marketplaces.length > 0) {
        where.marketplace = { in: marketplaces };
      }

      // Incremental: only fetch listings seen since last poll
      const currentPollTime = new Date();
      where.lastSeen = {
        gte: lastPollTime,
      };

      // Update last poll time before query
      lastPollTime = currentPollTime;

      const recentListings = await prisma.listing.findMany({
        where,
        orderBy: { lastSeen: "desc" },
        take: limit * 3, // Fetch more for better deduplication
      });

      const newListings = recentListings.filter(
        (listing) => !lastSeenIds.has(listing.id)
      );

      if (newListings.length > 0) {
        newListings.forEach((listing) => lastSeenIds.add(listing.id));

        const feedListings = newListings.map((listing) => ({
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

        const marketplaceAvgPrices = calculateMarketplaceAvgPrices(feedListings);
        const aggregated = aggregateListings(feedListings, {
          deduplicate: true,
          rank: true,
          marketplaceAvgPrices,
          limit,
        });

        res.write(
          `data: ${JSON.stringify({
            type: "listings",
            count: aggregated.length,
            listings: aggregated,
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: "heartbeat",
            timestamp: new Date().toISOString(),
            pollCount,
          })}\n\n`
        );
      }

      if (pollCount >= maxPolls) {
        res.write(
          `data: ${JSON.stringify({
            type: "closed",
            message: "Stream closed after maximum duration",
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
        clearInterval(pollInterval);
        res.end();
      }
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    }
  }, 5000); // Poll every 5 seconds

  // Cleanup on client disconnect
  req.on("close", () => {
    clearInterval(pollInterval);
    res.end();
  });
});

export { realtimeRouter };
