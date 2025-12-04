/**
 * Azure Function: Marketplace Scraper Worker
 * Runs every 6 hours to scrape all marketplaces
 */

import { app, InvocationContext, Timer } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";
import { ScraperOrchestrator } from "@magnus-flipper-ai/scraper-sync/orchestrator/scraperOrchestrator";
import { createWorkerLogger, generateCorrelationId } from "@magnus-flipper-ai/core/worker-logger";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function scraperTimer(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  const logger = createWorkerLogger("worker-scraper", correlationId);
  
  logger.info("Marketplace Scraper worker started", {
    startTime: new Date(startTime).toISOString(),
  });

  try {
    // Initialize orchestrator
    const orchestrator = new ScraperOrchestrator(supabaseUrl, supabaseKey);

    // Get all enabled scraper configs
    const { data: configs } = await supabase
      .from("scraper_configs")
      .select("*")
      .eq("enabled", true);

    if (!configs || configs.length === 0) {
      logger.warn("No enabled scraper configs found");
      return;
    }

    logger.info("Found enabled scraper configs", { count: configs.length });

    // Group configs by marketplace
    const configsByMarketplace = new Map<string, any[]>();
    for (const config of configs) {
      if (!configsByMarketplace.has(config.marketplace)) {
        configsByMarketplace.set(config.marketplace, []);
      }
      configsByMarketplace.get(config.marketplace)!.push(config);
    }

    // Run scrapers for each marketplace
    const results = [];
    for (const [marketplace, marketplaceConfigs] of configsByMarketplace.entries()) {
      try {
        logger.info("Starting scraper for marketplace", { marketplace });

        // Merge all search queries from all user configs for this marketplace
        const allQueries = new Set<string>();
        for (const cfg of marketplaceConfigs) {
          for (const query of cfg.search_queries || []) {
            allQueries.add(query);
          }
        }

        // Create aggregated config
        const aggregatedConfig = {
          marketplace,
          enabled: true,
          search_queries: Array.from(allQueries),
          location: marketplaceConfigs[0].location || undefined,
          max_price: Math.max(...marketplaceConfigs.map(c => c.max_price || 0)),
          min_price: Math.min(...marketplaceConfigs.map(c => c.min_price || Infinity)),
          categories: [],
          max_pages: Math.max(...marketplaceConfigs.map(c => c.max_pages || 3)),
          delay_min_ms: 2000,
          delay_max_ms: 5000,
          use_proxy: marketplaceConfigs.some(c => c.use_proxy),
          headless: true,
        };

        const result = await orchestrator.runScraper(marketplace, aggregatedConfig);
        results.push(result);

        logger.info("Marketplace scraper completed", {
          marketplace,
          totalScraped: result.total_scraped,
          durationMs: result.duration_ms,
          success: result.success,
        });
        
        // Log metric
        logger.metric("scrapes_per_minute", result.total_scraped, { marketplace });
      } catch (error: any) {
        logger.error(`Error running ${marketplace} scraper`, error, { marketplace });
      }
    }

    // Log summary
    const totalScraped = results.reduce((sum, r) => sum + r.total_scraped, 0);
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;
    const durationMs = Date.now() - startTime;

    logger.info("Scraper worker completed", {
      successful,
      failed,
      total: results.length,
      totalScraped,
      durationMs,
    });
    
    // Log metrics
    logger.metric("jobs_processed_total", results.length);
    logger.metric("jobs_failed_total", failed);

    // Store worker execution log
    await supabase.from("worker_logs").insert({
      worker_name: "marketplace_scraper",
      executed_at: new Date(startTime).toISOString(),
      duration_ms: Date.now() - startTime,
      marketplaces_scraped: results.length,
      total_items_scraped: totalScraped,
      successful_scrapers: successful,
      results: results,
    });
  } catch (error: any) {
    logger.error("Scraper worker error", error, {
      durationMs: Date.now() - startTime,
    });
    throw error;
  }
}

app.timer("scraperTimer", {
  schedule: "0 0 */6 * * *", // Every 6 hours
  handler: scraperTimer,
});

// Import health check handler
import "./health.js";
