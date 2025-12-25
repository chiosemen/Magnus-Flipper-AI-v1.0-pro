/**
 * Azure Function: Auto-Sell Worker
 * Runs every 3 minutes to detect new sales and finalize them
 */

import { app, InvocationContext, Timer } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";
import { detectSales } from "@magnus-flipper-ai/profit-engine/autosell/saleDetector";
import { finalizeSale } from "@magnus-flipper-ai/profit-engine/autosell/finalizeSale";
import { lockListingAcrossPlatforms } from "@magnus-flipper-ai/profit-engine/autosell/crossPlatformLock";

export async function autoSellTimer(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  const startTime = new Date();
  context.log(`Auto-Sell worker started at ${startTime.toISOString()}`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    context.error("Missing Supabase environment variables");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Step 1: Detect new sales across all marketplaces
    context.log("Detecting sales across marketplaces...");
    const saleEvents = await detectSales();

    if (saleEvents.length === 0) {
      context.log("No new sales detected.");
      return;
    }

    context.log(`Detected ${saleEvents.length} new sales`);

    // Step 2: Process each sale
    const results = [];
    for (const saleEvent of saleEvents) {
      try {
        context.log(
          `Processing sale ${saleEvent.id} from ${saleEvent.marketplace}...`
        );

        // Finalize the sale (calculate P&L, create ledger entries)
        const finalizationResult = await finalizeSale(saleEvent);

        if (!finalizationResult.success) {
          context.error(
            `Failed to finalize sale ${saleEvent.id}: ${finalizationResult.error}`
          );
          results.push({
            saleId: saleEvent.id,
            success: false,
            error: finalizationResult.error,
          });
          continue;
        }

        const finalizedSale = finalizationResult.finalizedSale!;

        // Lock listings across all other platforms
        const lockResult = await lockListingAcrossPlatforms(
          saleEvent.inventoryItemId,
          saleEvent.marketplace,
          saleEvent.id
        );

        context.log(
          `Sale ${saleEvent.id} processed successfully. Locked ${lockResult.totalLocked} listings.`
        );

        results.push({
          saleId: saleEvent.id,
          success: true,
          netProfit: finalizedSale.netProfit,
          lockedListings: lockResult.totalLocked,
        });
      } catch (error: any) {
        context.error(`Error processing sale ${saleEvent.id}:`, error);
        results.push({
          saleId: saleEvent.id,
          success: false,
          error: error.message,
        });
      }
    }

    // Step 3: Log summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    context.log(`Auto-Sell summary: ${successful} succeeded, ${failed} failed`);

    // Store worker execution log
    await supabase.from("worker_logs").insert({
      worker_name: "auto_sell",
      executed_at: startTime.toISOString(),
      duration_ms: Date.now() - startTime.getTime(),
      sales_detected: saleEvents.length,
      sales_processed: successful,
      sales_failed: failed,
      results: results,
    });
  } catch (error: any) {
    context.error("Auto-Sell worker error:", error);
    throw error;
  }
}

app.timer("autoSellTimer", {
  schedule: "0 */3 * * * *",
  handler: autoSellTimer,
});
