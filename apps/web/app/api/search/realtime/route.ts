import { NextRequest } from "next/server";
import { prisma } from "@magnus-flipper-ai/core/db";
import {
  aggregateListings,
  calculateMarketplaceAvgPrices,
  type AggregatedListing,
} from "@magnus-flipper-ai/feed-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/search/realtime
 * Server-Sent Events (SSE) stream for real-time feed updates
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const marketplaces = searchParams.get("marketplaces")
    ? searchParams.get("marketplaces")!.split(",").map((m) => m.trim().toLowerCase())
    : undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      send({ type: "connected", timestamp: new Date().toISOString() });

      // Poll for new listings every 5 seconds
      let lastSeenIds = new Set<string>();
      let pollCount = 0;
      const maxPolls = 120; // 10 minutes max (120 * 5s)

      // Track last poll timestamp for incremental updates
      let lastPollTime = new Date(Date.now() - 5 * 60 * 1000); // Start 5 minutes ago

      const pollInterval = setInterval(async () => {
        try {
          pollCount++;

          // Build query for new listings (incremental since last poll)
          const where: any = {
            isActive: true,
          };

          if (marketplaces && marketplaces.length > 0) {
            where.marketplace = { in: marketplaces };
          }

          // Only fetch listings seen since last poll (incremental)
          where.lastSeen = {
            gte: lastPollTime,
          };

          // Update last poll time before query
          const currentPollTime = new Date();
          
          // Fetch recent listings (optimized: only new since last poll)
          const recentListings = await prisma.listing.findMany({
            where,
            orderBy: { lastSeen: "desc" },
            take: limit * 3, // Fetch more for better deduplication
          });

          // Update last poll time after successful query
          lastPollTime = currentPollTime;

          // Filter out already-seen listings
          const newListings = recentListings.filter(
            (listing) => !lastSeenIds.has(listing.id)
          );

          if (newListings.length > 0) {
            // Update last seen IDs
            newListings.forEach((listing) => lastSeenIds.add(listing.id));

            // Transform to feed format
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

            // Aggregate (deduplicate + rank)
            const marketplaceAvgPrices = calculateMarketplaceAvgPrices(feedListings);
            const aggregated = aggregateListings(feedListings, {
              deduplicate: true,
              rank: true,
              marketplaceAvgPrices,
              limit,
            });

            // Send new listings
            send({
              type: "listings",
              count: aggregated.length,
              listings: aggregated,
              timestamp: new Date().toISOString(),
            });
          } else {
            // Send heartbeat
            send({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
              pollCount,
            });
          }

          // Stop after max polls
          if (pollCount >= maxPolls) {
            send({
              type: "closed",
              message: "Stream closed after maximum duration",
              timestamp: new Date().toISOString(),
            });
            clearInterval(pollInterval);
            controller.close();
          }
        } catch (error) {
          send({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          });
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
