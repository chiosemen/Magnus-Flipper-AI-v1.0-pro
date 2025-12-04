/**
 * API Route: Monthly Profit Trend
 * GET /api/profit/trend
 * Returns monthly profit trends
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getProfitTrend } from "@/lib/profit/trend";

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

    // Get monthly trend (returns last 12 months by default)
    const trend = await getProfitTrend(user.id);

    return NextResponse.json({
      success: true,
      data: trend,
    });
  } catch (error: any) {
    console.error("Error fetching profit trend:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
