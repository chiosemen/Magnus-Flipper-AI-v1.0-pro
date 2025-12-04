/**
 * Azure Function: Auto-Sell Worker
 * Runs every 3 minutes to detect new sales and finalize them
 */

import { app, InvocationContext, Timer } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";
import { detectSales } from "@magnus-flipper-ai/profit-engine/autosell/saleDetector";
import { finalizeSale } from "@magnus-flipper-ai/profit-engine/autosell/finalizeSale";
import { lockListingAcrossPlatforms } from "@magnus-flipper-ai/profit-engine/autosell/crossPlatformLock";
import { createWorkerLogger, generateCorrelationId } from "@magnus-flipper-ai/core/worker-logger.js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function autoSellTimer(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  const startTime = new Date();
  const correlationId = generateCorrelationId();
  const logger = createWorkerLogger("worker-autosell", correlationId);
  
  logger.info("Auto-Sell worker started", {
    startTime: startTime.toISOString(),
  });

  try {
    // Step 1: Detect new sales across all marketplaces
    logger.info("Detecting sales across marketplaces");
    const saleEvents = await detectSales();

    if (saleEvents.length === 0) {
      logger.info("No new sales detected");
      return;
    }

    logger.info("Detected new sales", { count: saleEvents.length });

    // Step 2: Process each sale
    const results = [];
    for (const saleEvent of saleEvents) {
      try {
        logger.info("Processing sale", {
          saleId: saleEvent.id,
          marketplace: saleEvent.marketplace,
        });

        // Finalize the sale (calculate P&L, create ledger entries)
        const finalizationResult = await finalizeSale(saleEvent);

        if (!finalizationResult.success) {
          logger.error(
            `Failed to finalize sale ${saleEvent.id}`,
            new Error(finalizationResult.error || 'Unknown error'),
            { saleId: saleEvent.id }
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

        logger.info("Sale processed successfully", {
          saleId: saleEvent.id,
          netProfit: finalizedSale.netProfit,
          lockedListings: lockResult.totalLocked,
        });
        
        // Log metric
        logger.metric("autosells_executed_total", 1, {
          marketplace: saleEvent.marketplace,
        });

        results.push({
          saleId: saleEvent.id,
          success: true,
          netProfit: finalizedSale.netProfit,
          lockedListings: lockResult.totalLocked,
        });
      } catch (error: any) {
        logger.error(`Error processing sale ${saleEvent.id}`, error, {
          saleId: saleEvent.id,
        });
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
    const durationMs = Date.now() - startTime.getTime();

    logger.info("Auto-Sell summary", {
      successful,
      failed,
      total: saleEvents.length,
      durationMs,
    });
    
    // Log metrics
    logger.metric("jobs_processed_total", saleEvents.length);
    logger.metric("jobs_failed_total", failed);

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
    logger.error("Auto-Sell worker error", error, {
      durationMs: Date.now() - startTime.getTime(),
    });
    throw error;
  }
}

app.timer("autoSellTimer", {
  schedule: "0 */3 * * * *",
  handler: autoSellTimer,
});

// Import health check handler
import "./health.js";
