import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@magnus-flipper-ai/core/db";
import {
  getSearchStats,
  getSearchActivityTimeline,
} from "@magnus-flipper-ai/core/analytics/search-analytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/searches/:id/stats
 * Get performance stats and activity timeline for a specific search
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: searchId } = await params;

    // Verify search belongs to user
    const search = await prisma.savedSearch.findUnique({
      where: { id: searchId },
      select: { userId: true },
    });

    if (!search) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    if (search.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get stats and activity
    const [stats, activity] = await Promise.all([
      getSearchStats(searchId),
      getSearchActivityTimeline(searchId, 20),
    ]);

    if (!stats) {
      return NextResponse.json({ error: "Stats not available" }, { status: 404 });
    }

    return NextResponse.json({
      stats: {
        searchId: stats.searchId,
        searchName: stats.searchName,
        marketplace: stats.marketplace,
        totalListingsScanned: stats.totalListingsScanned,
        totalMatchesFound: stats.totalMatchesFound,
        totalRuns: stats.totalRuns,
        lastRunAt: stats.lastRunAt?.toISOString() || null,
        avgMatchesPerDay: stats.avgMatchesPerDay,
        avgMatchesPerRun: stats.avgMatchesPerRun,
        createdAt: stats.createdAt.toISOString(),
        daysSinceCreation: stats.daysSinceCreation,
      },
      activity: activity.map((item) => ({
        date: item.date.toISOString(),
        title: item.title,
        price: item.price,
        marketplace: item.marketplace,
        url: item.url,
        imageUrl: item.imageUrl,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching search stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch search stats", message: error.message },
      { status: 500 }
    );
  }
}
