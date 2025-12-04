/**
 * API Route: Generate Shipping Label
 * POST /api/shipping/label
 * Generates a shipping label for an order
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createShippingLabel } from "@/lib/shipping/labels";
import { ShippingRequestSchema } from "@magnus-flipper-ai/shipping-engine/schemas/ShippingRequest";

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

    // Validate shipping request
    const validationResult = ShippingRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid shipping request",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const shippingRequest = validationResult.data;

    // Verify user owns this order
    const { data: saleItem, error: saleError } = await supabase
      .from("sold_items")
      .select("user_id")
      .eq("id", shippingRequest.saleId)
      .single();

    if (saleError || !saleItem || saleItem.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // Generate label
    const result = await createShippingLabel(shippingRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to generate label",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.label,
    });
  } catch (error: any) {
    console.error("Error generating shipping label:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
