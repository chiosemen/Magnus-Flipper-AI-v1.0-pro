import { NextRequest, NextResponse } from "next/server";
import type { UsedCarLeadPayload, UsedCarLeadResponse } from "@/types/usedCarLead";
import { recordEvent } from "@/lib/analytics";

type Dealer = {
  id: string;
  name?: string;
  endpoint?: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const dealerEngineEnabled = process.env.DEALER_ENGINE_ENABLED === "true";
  const allowPublicJobEnqueue =
    process.env.NODE_ENV === "development" &&
    (process.env.ADMIN_SCRAPE_ENABLED === "true" || process.env.ADMIN === "true");

  try {
    const body = (await req.json()) as UsedCarLeadPayload;

    // Validation
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

    // Persist lead (placeholder - integrate with DB/queue later)
    // await db.usedCarLeads.create({ data: { ...body, leadId } })

    // Analytics - Lead received
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

    // Guardrail: public web routes must not enqueue background jobs in production.
    // If the dealer engine is enabled, only allow job fan-out during local debugging with an admin flag.
    if (dealerEngineEnabled && allowPublicJobEnqueue) {
      const { dealerQueue } = await import("@magnus-flipper-ai/queue");
      const mod = eval("require")("@magnus-flipper-ai/dealer-engine");
      const getDealerRegistry = mod?.getDealerRegistry;

      // Fan out to dealers (only if dealerQueue/registry are available)
      if (dealerQueue && typeof getDealerRegistry === "function") {
        const registry = getDealerRegistry();
        const activeDealers = registry.getActiveDealers();

        // Cost guard: Max 5 dealers per lead
        const maxDealers = Math.min(activeDealers.length, 5);
        const selectedDealers = activeDealers.slice(0, maxDealers);

        const dealerJobs = selectedDealers.map((dealer: Dealer) => ({
          name: `dealer:${dealer.id}`,
          data: {
            leadId,
            dealerId: dealer.id,
            vehicle: {
              make: body.make,
              model: body.model,
              year: body.year,
              mileage: body.mileage,
              condition: body.condition,
            },
            location: body.zip,
            zip: body.zip,
          },
        }));

        await dealerQueue.addBulk(dealerJobs);

        recordEvent("dealer_job_enqueued", {
          leadId,
          dealerCount: dealerJobs.length,
          dealerIds: selectedDealers.map((d: Dealer) => d.id),
        });
      }
    }

    const response: UsedCarLeadResponse = {
      success: true,
      leadId,
      estimatedOfferMid,
      priceDelta,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("used-car lead error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
