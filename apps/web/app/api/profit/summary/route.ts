/**
 * API Route: Profit Summary
 * GET /api/profit/summary
 * Returns P&L summary for a date range
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { calculateProfitSummary } from "@/lib/profit/summary";

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate =
      searchParams.get("startDate") ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();

    // Calculate P&L
    const pnl = await calculateProfitSummary(user.id, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: pnl,
    });
  } catch (error: any) {
    console.error("Error fetching profit summary:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
