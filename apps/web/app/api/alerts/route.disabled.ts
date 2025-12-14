import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { getUserAlerts, markAllAlertsAsRead } from "@magnus-flipper-ai/core/alerts/alert-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/alerts
 * Fetch user's alerts (inbox)
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - unreadOnly: boolean (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await getUserAlerts(user.id, {
      limit,
      offset,
      unreadOnly,
    });

    return NextResponse.json({
      alerts: result.alerts.map((alert: any) => ({
        id: alert.id,
        title: alert.title,
        price: alert.price,
        marketplace: alert.marketplace,
        url: alert.url,
        alertType: alert.alertType,
        isRead: alert.isRead,
        isSent: alert.isSent,
        metadata: alert.metadata,
        createdAt: alert.createdAt.toISOString(),
        savedSearch: alert.savedSearch
          ? {
              name: alert.savedSearch.name,
            }
          : null,
      })),
      pagination: {
        total: result.total,
        unread: result.unread,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts/mark-all-read
 * Mark all alerts as read for the user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === "mark_all_read") {
      const count = await markAllAlertsAsRead(user.id);
      return NextResponse.json({
        success: true,
        message: `Marked ${count} alerts as read`,
        count,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use action: 'mark_all_read'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error marking alerts as read:", error);
    return NextResponse.json(
      { error: "Failed to mark alerts as read", message: error.message },
      { status: 500 }
    );
  }
}
