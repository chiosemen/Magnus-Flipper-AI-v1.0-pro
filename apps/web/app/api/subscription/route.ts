import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserSubscriptionTier, getSubscriptionDetails } from "@/lib/subscription";

/**
 * GET /api/subscription
 * Get current user's subscription information
 */
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

    // Get subscription tier
    const tier = await getUserSubscriptionTier(user.id);

    // Get full subscription details
    const details = await getSubscriptionDetails(user.id);

    return NextResponse.json({
      tier,
      ...details,
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

