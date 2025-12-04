/**
 * API Route: Carrier Configurations
 * GET /api/shipping/carriers - Get user's carrier configs
 * POST /api/shipping/carriers - Create/update carrier config
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get carrier configurations
    const { data: carriers, error } = await supabase
      .from("carrier_configs")
      .select("*")
      .eq("user_id", user.id)
      .order("carrier");

    if (error) {
      return NextResponse.json(
        { success: false, error: "Error fetching carrier configs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: carriers || [],
    });
  } catch (error: any) {
    console.error("Error fetching carriers:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { carrier, enabled, api_key, account_number, test_mode } = body;

    if (!carrier) {
      return NextResponse.json(
        { success: false, error: "Carrier is required" },
        { status: 400 }
      );
    }

    // Upsert carrier configuration
    const { data, error } = await supabase
      .from("carrier_configs")
      .upsert({
        user_id: user.id,
        carrier,
        enabled: enabled ?? true,
        api_key,
        account_number,
        test_mode: test_mode ?? (process.env.NODE_ENV !== 'production'),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Error saving carrier config" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error saving carrier config:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
