/**
 * WebSocket Server for Real-Time Feed
 * Standalone WebSocket server for feed updates
 * 
 * Note: Next.js App Router doesn't support WebSocket natively.
 * This is a standalone server that can be run separately.
 * 
 * Usage:
 *   import { createWebSocketServer } from './lib/websocket-server';
 *   const wss = createWebSocketServer(8080);
 */

import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "@magnus-flipper-ai/core/db";
import {
  aggregateListings,
  calculateMarketplaceAvgPrices,
} from "@magnus-flipper-ai/feed-engine";

interface ClientConnection {
  ws: WebSocket;
  id: string;
  marketplaces?: string[];
  lastSeenIds: Set<string>;
  lastPollTime: Date; // Track last poll time for incremental updates
}

export function createWebSocketServer(port: number = 8080) {
  const wss = new WebSocketServer({ port });

  const clients = new Map<string, ClientConnection>();

  wss.on("connection", (ws: WebSocket) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const client: ClientConnection = {
      ws,
      id: clientId,
      lastSeenIds: new Set<string>(),
      lastPollTime: new Date(Date.now() - 5 * 60 * 1000), // Start 5 minutes ago
    };

    clients.set(clientId, client);

    console.log(`[WebSocket] Client connected: ${clientId}`);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "connected",
        clientId,
        timestamp: new Date().toISOString(),
      })
    );

    // Handle messages from client
    ws.on("message", (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "subscribe") {
          client.marketplaces = data.marketplaces;
          ws.send(
            JSON.stringify({
              type: "subscribed",
              marketplaces: client.marketplaces,
              timestamp: new Date().toISOString(),
            })
          );
        } else if (data.type === "unsubscribe") {
          client.marketplaces = undefined;
          ws.send(
            JSON.stringify({
              type: "unsubscribed",
              timestamp: new Date().toISOString(),
            })
          );
        }
      } catch (error) {
        console.error(`[WebSocket] Error parsing message from ${clientId}:`, error);
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      clients.delete(clientId);
      console.log(`[WebSocket] Client disconnected: ${clientId}`);
    });

    ws.on("error", (error) => {
      console.error(`[WebSocket] Error for client ${clientId}:`, error);
      clients.delete(clientId);
    });
  });

  // Poll for new listings and broadcast to clients (optimized with incremental updates)
  setInterval(async () => {
    if (clients.size === 0) return;

    try {
      for (const [clientId, client] of clients.entries()) {
        if (client.ws.readyState !== WebSocket.OPEN) {
          clients.delete(clientId);
          continue;
        }

        try {
          const where: any = {
            isActive: true,
          };

          if (client.marketplaces && client.marketplaces.length > 0) {
            where.marketplace = {
              in: client.marketplaces,
            };
          }

          // Incremental: only fetch listings seen since last poll for this client
          const currentPollTime = new Date();
          where.lastSeen = {
            gte: client.lastPollTime,
          };

          // Update last poll time before query
          client.lastPollTime = currentPollTime;

          const recentListings = await prisma.listing.findMany({
            where,
            orderBy: { lastSeen: "desc" },
            take: 50, // Fetch more for better deduplication
          });

          const newListings = recentListings.filter(
            (listing) => !client.lastSeenIds.has(listing.id)
          );

          if (newListings.length > 0) {
            newListings.forEach((listing) => client.lastSeenIds.add(listing.id));

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
              limit: 20,
            });

            client.ws.send(
              JSON.stringify({
                type: "listings",
                count: aggregated.length,
                listings: aggregated,
                timestamp: new Date().toISOString(),
              })
            );
          } else {
            // Send heartbeat
            client.ws.send(
              JSON.stringify({
                type: "heartbeat",
                timestamp: new Date().toISOString(),
              })
            );
          }
        } catch (error) {
          console.error(`[WebSocket] Error polling for client ${clientId}:`, error);
          client.ws.send(
            JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            })
          );
        }
      }
    } catch (error) {
      console.error("[WebSocket] Error in polling loop:", error);
    }
  }, 5000); // Poll every 5 seconds

  console.log(`[WebSocket] Server listening on port ${port}`);
  return wss;
}
