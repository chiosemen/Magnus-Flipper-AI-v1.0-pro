/**
 * Alert Rules API Routes
 * GET /api/alert-rules - List user's alert rules
 * POST /api/alert-rules - Create new alert rule
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/alert-rules
 * List all alert rules for the authenticated user
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const activeOnly = searchParams.get("activeOnly") === "true";
      const marketplace = searchParams.get("marketplace");

      const supabase = getSupabaseAdmin();
      let query = supabase
        .from("alert_rules")
        .select("*")
        .eq("user_id", user.id);

      if (activeOnly) {
        query = query.eq("active", true);
      }

      if (marketplace) {
        query = query.or(`marketplace.eq.${marketplace},marketplace.is.null`);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("[API:AlertRules] Error fetching alert rules:", error.message);
        return NextResponse.json(
          { error: "Failed to fetch alert rules" },
          { status: 500 }
        );
      }

      return NextResponse.json(data || []);
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
 * POST /api/alert-rules
 * Create a new alert rule
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ user }) => {
    try {
      const body = await request.json();

      // Validation
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

      if (!name || !alert_type || !conditions || !notification_channels) {
        return NextResponse.json(
          {
            error:
              "Missing required fields: name, alert_type, conditions, notification_channels",
          },
          { status: 400 }
        );
      }

      // Validate alert_type
      const validAlertTypes = [
        "PRICE_DROP",
        "KEYWORD_MATCH",
        "INVENTORY_RESTOCK",
        "GEO_LOCATION",
        "CUSTOM",
      ];
      if (!validAlertTypes.includes(alert_type)) {
        return NextResponse.json(
          {
            error: `Invalid alert_type. Must be one of: ${validAlertTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Validate notification_channels
      const validChannels = ["EMAIL", "SMS", "PUSH", "WEBHOOK"];
      if (
        !Array.isArray(notification_channels) ||
        notification_channels.some((c) => !validChannels.includes(c))
      ) {
        return NextResponse.json(
          {
            error: `Invalid notification_channels. Must be array of: ${validChannels.join(", ")}`,
          },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("alert_rules")
        .insert({
          user_id: user.id,
          name,
          description,
          alert_type,
          marketplace,
          search_query,
          conditions,
          notification_channels,
          webhook_url,
          webhook_headers,
          active: active !== undefined ? active : true,
        })
        .select()
        .single();

      if (error) {
        console.error("[API:AlertRules] Error creating alert rule:", error.message);
        return NextResponse.json(
          { error: "Failed to create alert rule" },
          { status: 500 }
        );
      }

      return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
      console.error("[API:AlertRules] Exception:", error.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
