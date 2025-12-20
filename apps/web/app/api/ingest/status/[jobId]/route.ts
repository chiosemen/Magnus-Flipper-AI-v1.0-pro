import { NextResponse } from "next/server";
import { redis } from "@magnus-flipper-ai/queue";
import { blockUnlessDevAdmin } from "../../../_lib/legacyScrapeGate";

// Force dynamic rendering - this route must run at request time, never at build time
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Deprecated: legacy ingestion status endpoint. Kept for local debugging only.
    const blocked = blockUnlessDevAdmin();
    if (blocked) return blocked;

    // Verify Redis connection is available
    try {
      await redis.ping();
    } catch (redisError) {
      console.error("Redis connection failed:", redisError);
      return NextResponse.json(
        { 
          error: "Redis connection unavailable. Please ensure Redis is configured and running.",
          details: process.env.NODE_ENV === "development" ? String(redisError) : undefined
        },
        { status: 503 }
      );
    }

    const { jobId } = await params;

    // Read status from Redis hash
    const status = await redis.hgetall(`ingest:${jobId}:status`);

    if (!status || Object.keys(status).length === 0) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Read results from Redis list (up to 200 items)
    const rawResults = await redis.lrange(`ingest:${jobId}:results`, 0, 199);
    const results = rawResults.map((s: string) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Format results to match UI expectations
    // UI expects: [{ items: [...], listingsFound: number }]
    const formattedResults = results.length > 0
      ? [
          {
            items: results,
            listingsFound: results.length,
          },
        ]
      : [];

    return NextResponse.json({
      jobId,
      status: status.status || "unknown",
      message: status.message || "",
      progress: {
        totalBatches: Number(status.totalBatches || 0),
        doneBatches: Number(status.doneBatches || 0),
      },
      results: formattedResults,
    });
  } catch (error) {
    console.error("Error reading job status:", error);
    return NextResponse.json(
      { error: "Failed to read job status" },
      { status: 500 }
    );
  }
}
