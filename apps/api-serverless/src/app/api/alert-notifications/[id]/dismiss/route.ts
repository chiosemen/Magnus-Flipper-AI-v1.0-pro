/**
 * Alert Notification Dismiss API Route
 * POST /api/alert-notifications/[id]/dismiss - Dismiss a notification
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/alert-notifications/[id]/dismiss
 * Mark an alert notification as dismissed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async ({ user }) => {
    try {
      const { id } = params;

      const supabase = getSupabaseAdmin();
      const { data, error} = await supabase
        .from("alert_notifications")
        .update({ status: "DISMISSED" })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error(
          "[API:AlertNotifications] Error dismissing notification:",
          error.message
        );
        return NextResponse.json(
          { error: "Failed to dismiss notification" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error: any) {
      console.error("[API:AlertNotifications] Exception:", error.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
