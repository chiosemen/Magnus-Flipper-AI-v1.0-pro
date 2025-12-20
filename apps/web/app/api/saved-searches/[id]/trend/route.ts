import { NextResponse } from "next/server";
import { redis } from "@magnus-flipper-ai/queue";
import { blockUnlessDevAdmin } from "../../../_lib/legacyScrapeGate";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Deprecated: legacy Redis trend API (per-search metrics). Kept for local debugging only.
    const blocked = blockUnlessDevAdmin();
    if (blocked) return blocked;

    const { id } = await params;

    const raw = (await redis.lrange(`trend:${id}`, 0, 19)) as string[];
    const snapshots = raw
      .map((s: string) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
      })
      .filter(Boolean);

    // Format for Recharts
    const trendData = snapshots.map((snap: any) => ({
      timestamp: snap.timestamp,
      medianPrice: snap.medianPrice,
      minPrice: snap.minPrice,
      maxPrice: snap.maxPrice,
      count: snap.count,
    }));

    return NextResponse.json({ data: trendData });
  } catch (error) {
    console.error("Error fetching trend:", error);
    return NextResponse.json(
      { error: "Failed to fetch trend" },
      { status: 500 }
    );
  }
}
