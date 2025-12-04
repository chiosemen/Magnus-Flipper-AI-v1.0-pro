/**
 * API Route: Portfolio Overview
 * GET /api/profit/portfolio
 * Returns current portfolio snapshot
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getPortfolioSnapshot } from "@/lib/profit/portfolio";

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

    // Create portfolio snapshot
    const portfolio = await getPortfolioSnapshot(user.id);

    return NextResponse.json({
      success: true,
      data: portfolio,
    });
  } catch (error: any) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
