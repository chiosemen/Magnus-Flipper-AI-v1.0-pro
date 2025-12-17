/**
 * Active Search Poller
 * Polls active searches and dispatches scraper runs
 * 
 * This runs outside the web app (scraper-sync only).
 * Supports db-lite mode (no DB writes) and db-full mode (with DB writes).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ScraperOrchestrator } from "./scraperOrchestrator.js";
import type { ScraperConfig } from "../types/ScrapedListing.js";
import { IS_DB_LITE } from "../config/ingestionMode.js";
import { getMarketplaceQueue } from "../runtime/concurrency.js";
import { ACTIVE_SEARCHES } from "../dev/activeSearches.mock.js";
import {
  decideEngine,
  createDecisionInput,
  type SavedSearchRouting,
  type BulldogHealth,
} from "./decideEngine.js";

/**
 * Active Search definition (matches SavedSearch model)
 */
interface ActiveSearch {
  id: string;
  userId: string;
  marketplace: "facebook" | "vinted";
  query: string;
  isActive: boolean;
  lastRunAt: string | null;
  filters: {
    keywords?: string[];
    minPrice?: number;
    maxPrice?: number;
    maxDistanceMiles?: number;
    condition?: string[];
    location?: string;
  } | null;
  // Routing fields (added by migration 20260009)
  tier?: string;
  cadence_seconds?: number;
  execution_mode?: string;
  priority?: string;
}


/**
 * Convert ActiveSearch to ScraperConfig
 */
function searchToConfig(search: ActiveSearch): ScraperConfig {
  const filters = search.filters || {};
  
  return {
    marketplace: search.marketplace,
    enabled: true,
    search_queries: filters.keywords && filters.keywords.length > 0 
      ? filters.keywords 
      : [search.query],
    location: filters.location || undefined,
    max_price: filters.maxPrice || undefined,
    min_price: filters.minPrice || undefined,
    categories: filters.condition || undefined,
    max_pages: 3, // Conservative limit
    delay_min_ms: 2000,
    delay_max_ms: 5000,
    use_proxy: false,
    headless: true,
  };
}

/**
 * Poll active searches and dispatch scraper runs
 */
export async function pollActiveSearches(
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<void> {
  // Kill switch check
  const ingestionEnabled = process.env.INGESTION_ENABLED === "true";
  if (!ingestionEnabled) {
    console.log("[INGEST] Ingestion disabled via INGESTION_ENABLED flag. Exiting safely.");
    return;
  }

  // Initialize Supabase and orchestrator only if not in db-lite mode
  let supabase: SupabaseClient | null = null;
  let orchestrator: ScraperOrchestrator | null = null;

  if (!IS_DB_LITE) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials required in db-full mode");
    }
    supabase = createClient(supabaseUrl, supabaseKey);
    orchestrator = new ScraperOrchestrator(supabaseUrl, supabaseKey);
  } else {
    // In db-lite mode, create orchestrator with dummy credentials (won't be used)
    orchestrator = new ScraperOrchestrator("", "");
  }

  try {
    // Load active searches based on mode
    let activeSearches: ActiveSearch[];

    if (IS_DB_LITE) {
      // Use mock data in db-lite mode
      activeSearches = ACTIVE_SEARCHES as ActiveSearch[];
      console.log(`[INGEST] DB-LITE mode: Using ${activeSearches.length} mock searches`);
    } else {
      // Fetch from database in db-full mode
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data: searches, error } = await supabase
        .from("saved_searches")
        .select("id, user_id, marketplace, query, is_active, last_run_at, filters, tier, cadence_seconds, execution_mode, priority")
        .eq("is_active", true)
        .in("marketplace", ["facebook", "vinted"])
        .order("last_run_at", { ascending: true, nullsFirst: true });

      if (error) {
        console.error("[INGEST] Error fetching active searches:", error);
        return;
      }

      if (!searches || searches.length === 0) {
        console.log("[INGEST] No active searches found.");
        return;
      }

      activeSearches = searches.map((row) => ({
        id: row.id,
        userId: row.user_id,
        marketplace: row.marketplace,
        query: row.query,
        isActive: row.is_active,
        lastRunAt: row.last_run_at,
        filters: row.filters,
        tier: row.tier,
        cadence_seconds: row.cadence_seconds,
        execution_mode: row.execution_mode,
        priority: row.priority,
      }));

      console.log(`[INGEST] Found ${activeSearches.length} active searches`);
    }

    // Dispatch all searches using p-queue for concurrency control
    const runPromises: Promise<void>[] = [];

    for (const search of activeSearches) {
      const queue = getMarketplaceQueue(search.marketplace);

      const runPromise = queue.add(async () => {
        const startedAt = Date.now();

        // Routing decision (tier-based)
        let chosenEngine: 'bulldog' | 'apify' = 'bulldog';
        let routingReason = 'Default routing (no tier info)';

        if (!IS_DB_LITE && search.tier && search.cadence_seconds && search.execution_mode) {
          // Create routing input
          const routingSearch: SavedSearchRouting = {
            id: search.id,
            tier: search.tier as any,
            cadence_seconds: search.cadence_seconds,
            execution_mode: search.execution_mode as any,
            marketplace: search.marketplace,
            priority: search.priority as any,
          };

          // Get Bulldog health status (simplified for now - assume 'ok')
          // TODO: Implement actual health check via ScraperMonitor
          const bulldogHealth: BulldogHealth = 'ok';

          // Get Apify budget remaining (simplified for now - assume unlimited for elite, 0 for others)
          // TODO: Implement actual budget tracking
          const apifyBudgetRemaining = search.tier === 'elite' ? null : 0;

          // Decide engine
          const decision = decideEngine(
            createDecisionInput(routingSearch, bulldogHealth, apifyBudgetRemaining)
          );

          chosenEngine = decision.engine;
          routingReason = decision.reason;
        }

        console.log(`[INGEST] ▶️ ${search.marketplace} | ${search.query} | Engine: ${chosenEngine} (${routingReason})`);

        try {
          if (!orchestrator) {
            throw new Error("Orchestrator not initialized");
          }

          const config = searchToConfig(search);

          // TODO: Route to Apify if chosenEngine === 'apify'
          // For now, all routes go through Bulldog (existing behavior)
          const result = await orchestrator.runScraper(
            search.marketplace,
            config
          );

          const durationMs = Date.now() - startedAt;

          if (result.success) {
            console.log(`[INGEST] ✅ ${search.marketplace}`, {
              listingsFound: result.total_scraped,
              durationMs,
              engine: chosenEngine
            });

            // Update database only in db-full mode
            if (!IS_DB_LITE && supabase) {
              // Get current total_runs value
              const { data: current } = await supabase
                .from("saved_searches")
                .select("total_runs")
                .eq("id", search.id)
                .single();

              await supabase
                .from("saved_searches")
                .update({
                  last_run_at: new Date().toISOString(),
                  total_runs: (current?.total_runs || 0) + 1,
                })
                .eq("id", search.id);

              // Log to scrape_runs table with engine annotation
              await supabase
                .from("scrape_runs")
                .insert({
                  marketplace: search.marketplace,
                  user_id: search.userId,
                  saved_search_id: search.id,
                  tier: search.tier || 'free',
                  engine: chosenEngine,
                  success: true,
                  duration_ms: durationMs,
                });
            }
          } else {
            const errorMsg = result.errors && result.errors.length > 0
              ? result.errors[0]
              : "Unknown error";
            console.error(`[INGEST] ❌ ${search.marketplace}`, {
              error: errorMsg,
              engine: chosenEngine
            });

            // Log failed run to scrape_runs
            if (!IS_DB_LITE && supabase) {
              await supabase
                .from("scrape_runs")
                .insert({
                  marketplace: search.marketplace,
                  user_id: search.userId,
                  saved_search_id: search.id,
                  tier: search.tier || 'free',
                  engine: chosenEngine,
                  success: false,
                  duration_ms: durationMs,
                  error_code: 'SCRAPE_FAILED',
                  error_message: errorMsg,
                });
            }
          }
        } catch (error: any) {
          const durationMs = Date.now() - startedAt;
          console.error(`[INGEST] ❌ ${search.marketplace}`, {
            error: error.message,
            engine: chosenEngine
          });

          // Log exception to scrape_runs
          if (!IS_DB_LITE && supabase) {
            await supabase
              .from("scrape_runs")
              .insert({
                marketplace: search.marketplace,
                user_id: search.userId,
                saved_search_id: search.id,
                tier: search.tier || 'free',
                engine: chosenEngine,
                success: false,
                duration_ms: durationMs,
                error_code: 'EXCEPTION',
                error_message: error.message,
              })
              .catch((insertError) => {
                // Silently fail scrape_runs insert to avoid breaking the flow
                console.error('[INGEST] Failed to log scrape_run:', insertError);
              });
          }
        }
      });

      runPromises.push(runPromise);
    }

    // Wait for all runs to complete
    await Promise.allSettled(runPromises);

    console.log("[INGEST] Polling cycle complete");
  } catch (error: any) {
    console.error("[INGEST] Fatal error in pollActiveSearches:", error);
  }
}
