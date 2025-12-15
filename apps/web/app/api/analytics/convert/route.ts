import { NextRequest, NextResponse } from "next/server";
import type { ConversionEvent } from "@/types/conversion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Conversion Analytics Endpoint
 * 
 * Receives conversion events from client-side tracking.
 * Stub implementation - logs events for now, can be extended to persist to DB.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate payload is an array
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid payload: expected array of events" },
        { status: 400 }
      );
    }

    // Validate each event has required fields
    const events = body as ConversionEvent[];
    for (const event of events) {
      if (
        !event.pathId ||
        !event.fromPage ||
        !event.eventType ||
        !event.timestamp ||
        !event.sessionId ||
        !event.anonUserId
      ) {
        return NextResponse.json(
          { error: "Invalid event: missing required fields" },
          { status: 400 }
        );
      }
    }

    // Log events (placeholder for future DB integration)
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Received ${events.length} conversion events`);
      console.log("[Analytics] Sample event:", events[0]);
    }

    // TODO: Persist to database or analytics service
    // await db.conversionEvents.createMany({ data: events });

    return NextResponse.json({
      success: true,
      received: events.length,
    });
  } catch (error) {
    console.error("[Analytics] Error processing conversion events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

