import { NextResponse } from "next/server";
import { redis, ingestQueue } from "@magnus-flipper-ai/queue";
import type { ScrapeJob } from "@magnus-flipper-ai/queue";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "anonymous";

    const saved = await redis.hgetall(`saved:search:${userId}:${id}`);
    if (!saved || !saved.query) {
      return NextResponse.json(
        { error: "Saved search not found" },
        { status: 404 }
      );
    }

    // Create parent job
    const parent = await ingestQueue.add("ingest-parent", { kind: "parent" });
    const jobId = String(parent.id);

    // Initialize status
    await redis.hset(`ingest:${jobId}:status`, {
      status: "queued",
      message: "Queued for scanning",
      totalBatches: "1",
      doneBatches: "0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Extract tier from query params or default to "free"
    const tier = (searchParams.get("tier") as "free" | "pro" | "premium") || "free";
    
    // Generate traceId for observability
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Enqueue scrape job
    const scrapeJob: ScrapeJob = {
      jobId,
      marketplace: (saved.marketplace || "facebook") as "facebook",
      query: saved.query,
      region: saved.region,
      page: 1,
      batchSize: 20,
      userId: saved.userId,
      savedSearchId: id,
      tier,
      traceId,
    };

    await ingestQueue.add(`scrape:${saved.marketplace}:1`, scrapeJob);

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error("Error running saved search:", error);
    return NextResponse.json(
      { error: "Failed to run saved search" },
      { status: 500 }
    );
  }
}
