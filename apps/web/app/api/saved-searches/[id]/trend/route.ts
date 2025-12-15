import { NextResponse } from "next/server";
import { redis } from "@magnus-flipper-ai/queue";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const raw = await redis.lrange(`trend:${id}`, 0, 19);
    const snapshots = raw.map((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    }).filter(Boolean);

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
