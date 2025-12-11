import { NextRequest } from "next/server";
import { prisma } from "@magnus-flipper-ai/core/db";
import {
  aggregateListings,
  calculateMarketplaceAvgPrices,
} from "@magnus-flipper-ai/feed-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * WebSocket endpoint for real-time feed updates
 * Note: Next.js doesn't natively support WebSocket, so this uses HTTP upgrade
 * For production, use a dedicated WebSocket server (e.g., ws library with Express)
 */
export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get("upgrade");

  if (upgradeHeader !== "websocket") {
    return new Response(
      JSON.stringify({
        error: "WebSocket upgrade required",
        message: "This endpoint requires WebSocket connection. Use /api/search/realtime for SSE.",
      }),
      {
        status: 426,
        headers: {
          "Content-Type": "application/json",
          Upgrade: "websocket",
        },
      }
    );
  }

  // In production, this would upgrade to WebSocket
  // For now, return instructions to use SSE endpoint
  return new Response(
    JSON.stringify({
      message: "WebSocket not yet implemented in Next.js App Router",
      alternative: "Use /api/search/realtime for Server-Sent Events (SSE)",
      websocketUrl: "wss://api.magnusflipper.ai/ws/feed", // Future WebSocket server URL
    }),
    {
      status: 501,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
