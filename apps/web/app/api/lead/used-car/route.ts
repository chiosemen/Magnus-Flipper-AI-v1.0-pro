import { NextRequest, NextResponse } from "next/server";
import type { UsedCarLeadPayload, UsedCarLeadResponse } from "@/types/usedCarLead";
import { recordEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * STUB: Decoupled from @magnus-flipper-ai/queue and dealer-engine
 * Dealer engine functionality disabled - leads are validated but not processed
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UsedCarLeadPayload;

    // Validate the payload
    if (
      !body.make ||
      !body.model ||
      !body.year ||
      body.mileage === undefined ||
      !body.condition ||
      !body.zip ||
      body.estimatedRetail === undefined ||
      body.estimatedOfferLow === undefined ||
      body.estimatedOfferHigh === undefined
    ) {
      return NextResponse.json(
        { error: "Invalid payload: missing required fields" },
        { status: 400 }
      );
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (body.year < 1990 || body.year > currentYear + 1) {
      return NextResponse.json(
        { error: "Invalid year: must be between 1990 and " + (currentYear + 1) },
        { status: 400 }
      );
    }

    // Validate mileage
    if (body.mileage < 0 || body.mileage > 500000) {
      return NextResponse.json(
        { error: "Invalid mileage: must be between 0 and 500,000" },
        { status: 400 }
      );
    }

    // Validate ZIP
    if (!/^\d{5}$/.test(body.zip)) {
      return NextResponse.json(
        { error: "Invalid ZIP code: must be 5 digits" },
        { status: 400 }
      );
    }

    // Validate offer range
    if (body.estimatedOfferLow >= body.estimatedOfferHigh) {
      return NextResponse.json(
        { error: "Invalid offer range: low must be less than high" },
        { status: 400 }
      );
    }

    if (body.estimatedRetail < body.estimatedOfferHigh) {
      return NextResponse.json(
        { error: "Invalid pricing: retail must be greater than or equal to offer high" },
        { status: 400 }
      );
    }

    const estimatedOfferMid = Math.round(
      (body.estimatedOfferLow + body.estimatedOfferHigh) / 2
    );
    const priceDelta = body.estimatedRetail - estimatedOfferMid;
    const leadId = crypto.randomUUID();

    // Track analytics
    recordEvent("lead_received", {
      make: body.make,
      model: body.model,
      year: body.year,
      estimatedRetail: body.estimatedRetail,
      estimatedOfferMid,
      priceDelta,
      source: body.source,
      leadId,
    });

    // Return accepted response without dealer fan-out
    return NextResponse.json(
      { status: "dealer_engine_disabled", message: "Lead validated but dealer engine is disabled" },
      { status: 202 }
    );
  } catch (err) {
    console.error("used-car lead error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
