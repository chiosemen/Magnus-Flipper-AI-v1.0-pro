import { NextResponse } from "next/server";
import { redis } from "@magnus-flipper-ai/queue";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
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
    const results = rawResults.map((s) => {
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
