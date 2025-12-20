import { NextResponse } from "next/server";
import { redis } from "@magnus-flipper-ai/queue";
import { nanoid } from "nanoid";
import cronParser from "cron-parser";
import type { SavedSearch } from "@magnus-flipper-ai/queue";
import { blockUnlessDevAdmin } from "../_lib/legacyScrapeGate";

function nextRun(cron: string, fromDate: Date = new Date()): number {
  try {
    const it = cronParser.parseExpression(cron, { currentDate: fromDate });
    return it.next().getTime();
  } catch (error) {
    console.error("Invalid cron expression:", cron, error);
    // Default to 1 hour from now if cron is invalid
    return Date.now() + 60 * 60 * 1000;
  }
}

const CRON_LABELS: Record<string, string> = {
  "*/5 * * * *": "Every 5 minutes",
  "*/15 * * * *": "Every 15 minutes",
  "*/30 * * * *": "Every 30 minutes",
  "0 * * * *": "Hourly",
  "0 */6 * * *": "Every 6 hours",
  "0 9 * * *": "Daily 9am",
};

export async function POST(req: Request) {
  try {
    // Deprecated: legacy Redis saved-search scheduler API. Kept for local debugging only.
    const blocked = blockUnlessDevAdmin(req);
    if (blocked) return blocked;

    const body = await req.json();
    const { userId, query, region, cron, priceDropPct, id } = body;

    if (!userId || !query || !region || !cron) {
      return NextResponse.json(
        { error: "Missing required fields: userId, query, region, cron" },
        { status: 400 }
      );
    }

    const searchId = id || nanoid();
    const now = new Date().toISOString();

    const saved: SavedSearch = {
      id: searchId,
      userId,
      query,
      region,
      marketplace: "facebook",
      cron,
      cronLabel: CRON_LABELS[cron] || cron,
      priceDropPct: priceDropPct ? Number(priceDropPct) : undefined,
      paused: false,
      createdAt: now,
      updatedAt: now,
    };

    // Store in Redis hash (using new schema: saved:search:{userId}:{id})
    await redis.hset(`saved:search:${userId}:${searchId}`, {
      id: saved.id,
      userId: saved.userId,
      query: saved.query,
      region: saved.region,
      marketplace: saved.marketplace,
      cron: saved.cron,
      cronLabel: saved.cronLabel || "",
      priceDropPct: saved.priceDropPct ? String(saved.priceDropPct) : "",
      paused: "false",
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });

    // Add to index set
    await redis.sadd(`saved:search:index:${userId}`, searchId);

    // Compute nextRunAt and add to sorted set
    const nextRunAt = nextRun(cron, new Date());
    await redis.zadd("saved:due", nextRunAt, `${userId}:${searchId}`);

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Error saving search:", error);
    return NextResponse.json(
      { error: "Failed to save search" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Deprecated: legacy Redis saved-search scheduler API. Kept for local debugging only.
    const blocked = blockUnlessDevAdmin(req);
    if (blocked) return blocked;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "anonymous";

    const ids = (await redis.smembers(`saved:search:index:${userId}`)) as string[];
    const searches = await Promise.all(
      ids.map(async (id: string) => {
        const data = await redis.hgetall(`saved:search:${userId}:${id}`);
        if (!data || !data.id) return null;

        return {
          id: data.id,
          userId: data.userId,
          query: data.query,
          region: data.region,
          marketplace: data.marketplace || "facebook",
          cron: data.cron,
          cronLabel: data.cronLabel,
          priceDropPct: data.priceDropPct ? Number(data.priceDropPct) : undefined,
          paused: data.paused === "true",
          lastRun: data.lastRun || undefined,
          trend: data.trend || undefined,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      })
    );

    return NextResponse.json({ items: searches.filter(Boolean) });
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved searches" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // Deprecated: legacy Redis saved-search scheduler API. Kept for local debugging only.
    const blocked = blockUnlessDevAdmin(req);
    if (blocked) return blocked;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "anonymous";
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    await redis.del(`saved:search:${userId}:${id}`);
    await redis.srem(`saved:search:index:${userId}`, id);
    await redis.zrem("saved:due", `${userId}:${id}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    return NextResponse.json(
      { error: "Failed to delete saved search" },
      { status: 500 }
    );
  }
}
