/**
 * Alert Notifications API Routes
 * GET /api/alert-notifications - List triggered alert notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/alert-notifications
 * List all alert notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      const alertRuleId = searchParams.get("alertRuleId");
      const limit = parseInt(searchParams.get("limit") || "100");

      const supabase = getSupabaseAdmin();
      let query = supabase
        .from("alert_notifications")
        .select("*")
        .eq("user_id", user.id);

      if (status) {
        query = query.eq("status", status);
      }

      if (alertRuleId) {
        query = query.eq("alert_rule_id", alertRuleId);
      }

      query = query.order("created_at", { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error(
          "[API:AlertNotifications] Error fetching notifications:",
          error.message
        );
        return NextResponse.json(
          { error: "Failed to fetch alert notifications" },
          { status: 500 }
        );
      }

      return NextResponse.json(data || []);
    } catch (error: any) {
      console.error("[API:AlertNotifications] Exception:", error.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
