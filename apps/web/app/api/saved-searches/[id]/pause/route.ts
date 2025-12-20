import { NextResponse } from "next/server";
import { redis } from "@magnus-flipper-ai/queue";
import { blockUnlessDevAdmin } from "../../../_lib/legacyScrapeGate";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Deprecated: legacy Redis saved-search scheduler API. Kept for local debugging only.
    const blocked = blockUnlessDevAdmin(req);
    if (blocked) return blocked;

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "anonymous";

    const key = `saved:search:${userId}:${id}`;
    const current = await redis.hget(key, "paused");
    const newPaused = current !== "true";

    await redis.hset(key, {
      paused: newPaused ? "true" : "false",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ paused: newPaused });
  } catch (error) {
    console.error("Error toggling pause:", error);
    return NextResponse.json(
      { error: "Failed to toggle pause" },
      { status: 500 }
    );
  }
}
