/**
 * Alert Rule Detail API Routes
 * GET /api/alert-rules/[id] - Get specific alert rule
 * PUT /api/alert-rules/[id] - Update alert rule
 * DELETE /api/alert-rules/[id] - Delete alert rule
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/alert-rules/[id]
 * Get a specific alert rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async ({ user }) => {
    try {
      const { id } = params;

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("alert_rules")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("[API:AlertRules] Error fetching alert rule:", error.message);
        return NextResponse.json(
          { error: "Alert rule not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    } catch (error: any) {
      console.error("[API:AlertRules] Exception:", error.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

/**
 * PUT /api/alert-rules/[id]
 * Update an alert rule
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async ({ user }) => {
    try {
      const { id } = params;
      const body = await request.json();

      const {
        name,
        description,
        alert_type,
        marketplace,
        search_query,
        conditions,
        notification_channels,
        webhook_url,
        webhook_headers,
        active,
      } = body;

      // Build update object (only include provided fields)
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (alert_type !== undefined) updateData.alert_type = alert_type;
      if (marketplace !== undefined) updateData.marketplace = marketplace;
      if (search_query !== undefined) updateData.search_query = search_query;
      if (conditions !== undefined) updateData.conditions = conditions;
      if (notification_channels !== undefined)
        updateData.notification_channels = notification_channels;
      if (webhook_url !== undefined) updateData.webhook_url = webhook_url;
      if (webhook_headers !== undefined)
        updateData.webhook_headers = webhook_headers;
      if (active !== undefined) updateData.active = active;

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("alert_rules")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("[API:AlertRules] Error updating alert rule:", error.message);
        return NextResponse.json(
          { error: "Failed to update alert rule" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error: any) {
      console.error("[API:AlertRules] Exception:", error.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/alert-rules/[id]
 * Delete an alert rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async ({ user }) => {
    try {
      const { id } = params;

      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("alert_rules")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[API:AlertRules] Error deleting alert rule:", error.message);
        return NextResponse.json(
          { error: "Failed to delete alert rule" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("[API:AlertRules] Exception:", error.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
