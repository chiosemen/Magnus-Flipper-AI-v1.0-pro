import { NextResponse } from "next/server";

// Force dynamic rendering - this route must run at request time, never at build time
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * STUB: Decoupled from @magnus-flipper-ai/queue
 * This endpoint is disabled - scraping is handled by background workers
 */
export async function POST(req: Request) {
  return NextResponse.json(
    {
      error: "Scraping endpoint disabled. Background workers handle all scraping operations.",
      message: "Use /api/deals to view pooled scraper results"
    },
    { status: 503 }
  );
}
