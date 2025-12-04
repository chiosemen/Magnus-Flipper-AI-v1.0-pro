/**
 * Azure Function: Shipment Tracker Worker
 * Runs every 10 minutes to update tracking status for active shipments
 */

import { app, InvocationContext, Timer } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";
import { batchTrackShipments } from "@magnus-flipper-ai/shipping-engine/tracking/trackingManager";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function trackerTimer(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  const startTime = new Date();
  context.log(`Shipment Tracker worker started at ${startTime.toISOString()}`);

  try {
    // Step 1: Get all active shipments that need tracking updates
    const { data: activeLabels, error } = await supabase
      .from("shipping_labels")
      .select("tracking_number, carrier")
      .in("status", ["purchased", "shipped"])
      .order("created_at", { ascending: false });

    if (error) {
      context.error("Error fetching active labels:", error);
      throw error;
    }

    if (!activeLabels || activeLabels.length === 0) {
      context.log("No active shipments to track.");
      return;
    }

    context.log(`Tracking ${activeLabels.length} active shipments...`);

    // Step 2: Batch track all shipments
    const trackingRequests = activeLabels.map((label) => ({
      trackingNumber: label.tracking_number,
      carrier: label.carrier,
    }));

    const results = await batchTrackShipments(trackingRequests);

    // Step 3: Process results
    let updated = 0;
    let delivered = 0;
    let exceptions = 0;

    for (const result of results) {
      if (result.success && result.events && result.events.length > 0) {
        updated++;

        // Check for delivered status
        const latestEvent = result.events[0];
        if (
          latestEvent.status === "delivered" ||
          latestEvent.status === "out_for_delivery"
        ) {
          delivered++;

          // Update label status
          await supabase
            .from("shipping_labels")
            .update({ status: "delivered" })
            .eq("tracking_number", result.trackingNumber);
        }

        // Check for exceptions
        if (latestEvent.status === "exception" || latestEvent.status === "failed") {
          exceptions++;
        }
      }
    }

    context.log(
      `Tracking update complete: ${updated} updated, ${delivered} delivered, ${exceptions} exceptions`
    );

    // Store worker execution log
    await supabase.from("worker_logs").insert({
      worker_name: "shipment_tracker",
      executed_at: startTime.toISOString(),
      duration_ms: Date.now() - startTime.getTime(),
      shipments_tracked: activeLabels.length,
      shipments_updated: updated,
      shipments_delivered: delivered,
      shipments_exception: exceptions,
    });
  } catch (error: any) {
    context.error("Shipment Tracker worker error:", error);
    throw error;
  }
}

app.timer("trackerTimer", {
  schedule: "0 */10 * * * *",
  handler: trackerTimer,
});
