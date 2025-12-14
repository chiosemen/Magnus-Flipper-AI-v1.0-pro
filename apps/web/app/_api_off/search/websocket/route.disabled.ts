// DISABLED: This route imports backend-only modules (@magnus-flipper-ai/core/db, @magnus-flipper-ai/feed-engine)
// and breaks Next.js build. MM v1 does NOT need this route.
// Temporarily disabled for v1 deployment.

import { NextRequest } from "next/server";
import { prisma } from "@magnus-flipper-ai/core/db";
import {
  aggregateListings,
  calculateMarketplaceAvgPrices,
} from "@magnus-flipper-ai/feed-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/search/websocket
 * WebSocket endpoint for real-time feed updates (alternative to SSE)
 */
export async function GET(request: NextRequest) {
  // WebSocket upgrade handling would go here
  // For now, return 501 Not Implemented
  return new Response("WebSocket endpoint not implemented", {
    status: 501,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
