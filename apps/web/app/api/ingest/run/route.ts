import { NextResponse } from "next/server";
import { ingestQueue, redis, type IngestRunPayload, type Marketplace, type ScrapeJob } from "@magnus-flipper-ai/queue";

export async function POST(req: Request) {
  try {
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
