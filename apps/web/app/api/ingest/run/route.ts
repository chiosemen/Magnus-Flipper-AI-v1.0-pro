import { NextResponse } from "next/server";
import { ingestQueue, redis, type IngestRunPayload, type Marketplace, type ScrapeJob } from "@magnus-flipper-ai/queue";

// Force dynamic rendering - this route must run at request time, never at build time
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
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

    const body = await req.json();

    // Handle both new format (IngestRunPayload) and legacy format from MM Agent
    let query: string;
    let region: string;
    let marketplaces: Marketplace[];

    if (body.query && body.region) {
      // New format
      query = body.query;
      region = body.region;
      marketplaces = (body.marketplaces?.length
        ? body.marketplaces
        : ["facebook"]) as Marketplace[];
    } else if (body.searches && body.searches.length > 0) {
      // Legacy format from MM Agent
      const firstSearch = body.searches[0];
      query = firstSearch.query || "";
      region = body.geo === "UK" ? "UK" : "US";
      marketplaces = (body.marketplaces?.length
        ? body.marketplaces
        : ["facebook"]) as Marketplace[];
    } else {
      return NextResponse.json(
        { error: "Invalid payload: missing query or searches" },
        { status: 400 }
      );
    }

    const pagesPerMarketplace = body.pagesPerMarketplace ?? 1;
    const batchSize = body.batchSize ?? 20;

    // Create parent job
    const parent = await ingestQueue.add("ingest-parent", { kind: "parent" });
    const jobId = String(parent.id);

    // Initialize status in Redis
    const totalBatches = marketplaces.length * pagesPerMarketplace;
    await redis.hset(`ingest:${jobId}:status`, {
      status: "queued",
      message: "Queued for scanning",
      totalBatches: String(totalBatches),
      doneBatches: "0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Extract tier from body or default to "free"
    const tier = (body.tier as "free" | "pro" | "premium") || "free";
    
    // Generate traceId for observability
    const traceId = body.traceId || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Fan out batch jobs
    const batchJobs: ScrapeJob[] = [];
    for (const marketplace of marketplaces) {
      for (let page = 1; page <= pagesPerMarketplace; page++) {
        batchJobs.push({
          jobId,
          marketplace,
          query,
          region,
          page,
          batchSize,
          tier,
          traceId,
        });
      }
    }

    // Add all batch jobs to queue
    await ingestQueue.addBulk(
      batchJobs.map((data) => ({
        name: `scrape:${data.marketplace}:${data.page}`,
        data,
      }))
    );

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error("Error enqueueing ingest job:", error);
    return NextResponse.json(
      { error: "Failed to enqueue job" },
      { status: 500 }
    );
  }
}
