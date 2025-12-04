/**
 * API Route: Track Shipment
 * GET /api/shipping/track/[trackingNumber]
 * Returns tracking information for a shipment
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { trackShippingLabel } from "@/lib/shipping/tracking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { trackingNumber } = await params;

    // Get shipping label info
    const { data: label, error: labelError } = await supabase
      .from("shipping_labels")
      .select("*")
      .eq("tracking_number", trackingNumber)
      .single();

    if (labelError || !label) {
      return NextResponse.json(
        { success: false, error: "Tracking number not found" },
        { status: 404 }
      );
    }

    // Get latest tracking events
    const { data: events, error: eventsError } = await supabase
      .from("tracking_events")
      .select("*")
      .eq("tracking_number", trackingNumber)
      .order("timestamp", { ascending: false });

    if (eventsError) {
      return NextResponse.json(
        { success: false, error: "Error fetching tracking events" },
        { status: 500 }
      );
    }

    // If no events or events are old, fetch fresh tracking data
    const latestEventTime = events && events.length > 0
      ? new Date(events[0].timestamp).getTime()
      : 0;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    if (latestEventTime < fiveMinutesAgo) {
        // Fetch fresh tracking data
        try {
          await trackShippingLabel(trackingNumber, label.carrier);

        // Re-fetch events
        const { data: freshEvents } = await supabase
          .from("tracking_events")
          .select("*")
          .eq("tracking_number", trackingNumber)
          .order("timestamp", { ascending: false });

        return NextResponse.json({
          success: true,
          data: {
            label,
            events: freshEvents || events,
          },
        });
      } catch (trackError) {
        console.error("Error fetching fresh tracking:", trackError);
        // Return cached events if fresh fetch fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        label,
        events,
      },
    });
  } catch (error: any) {
    console.error("Error tracking shipment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
