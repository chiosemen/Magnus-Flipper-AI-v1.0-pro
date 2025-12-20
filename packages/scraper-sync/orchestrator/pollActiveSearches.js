/**
 * Active Search Poller
 * Polls active searches and dispatches scraper runs
 *
 * This runs outside the web app (scraper-sync only).
 * Supports db-lite mode (no DB writes) and db-full mode (with DB writes).
 */
import { createClient } from "@supabase/supabase-js";
import { ScraperOrchestrator } from "./scraperOrchestrator.js";
import { IS_DB_LITE } from "../config/ingestionMode.js";
import { getMarketplaceQueue } from "../runtime/concurrency.js";
import { ACTIVE_SEARCHES } from "../dev/activeSearches.mock.js";
/**
 * Convert ActiveSearch to ScraperConfig
 */
function searchToConfig(search) {
    const { keywords, min_price, max_price, location, condition, } = (search.params ?? {});
    const normalizedKeywords = Array.isArray(keywords) && keywords.length > 0
        ? keywords
        : [];
    return {
        marketplace: search.marketplace,
        enabled: true,
        search_queries: normalizedKeywords,
        location: location || undefined,
        max_price: max_price ?? undefined,
        min_price: min_price ?? undefined,
        categories: condition || undefined,
        max_pages: 3, // Conservative limit
        delay_min_ms: 2000,
        delay_max_ms: 5000,
        use_proxy: false,
        headless: true,
    };
}
function buildDealsPayload(search, listings) {
    const seen = new Set();
    const now = new Date().toISOString();
    return listings
        .map((listing) => {
        const url = listing.link;
        if (!url || seen.has(url))
            return null;
        seen.add(url);
        const createdAt = listing.timestamp && !Number.isNaN(Date.parse(listing.timestamp))
            ? new Date(listing.timestamp).toISOString()
            : now;
        return {
            search_id: search.id,
            marketplace: listing.marketplace || search.marketplace,
            title: listing.title,
            price: Number.isFinite(listing.price) ? listing.price : null,
            currency: listing.currency || "USD",
            location: listing.location,
            url,
            raw: listing,
            created_at: createdAt,
        };
    })
        .filter(Boolean);
}
/**
 * Poll active searches and dispatch scraper runs
 */
export async function pollActiveSearches(supabaseUrl, supabaseKey) {
    // Kill switch check
    const ingestionEnabled = process.env.INGESTION_ENABLED === "true";
    if (!ingestionEnabled) {
        console.log("[INGEST] Ingestion disabled via INGESTION_ENABLED flag. Exiting safely.");
        return;
    }
    // Initialize Supabase and orchestrator only if not in db-lite mode
    let supabase = null;
    let orchestrator = null;
    if (!IS_DB_LITE) {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase credentials required in db-full mode");
        }
        supabase = createClient(supabaseUrl, supabaseKey);
        orchestrator = new ScraperOrchestrator(supabaseUrl, supabaseKey);
    }
    else {
        // In db-lite mode, create orchestrator with dummy credentials (won't be used)
        orchestrator = new ScraperOrchestrator("", "");
    }
    try {
        // Load active searches based on mode
        let activeSearches;
        if (IS_DB_LITE) {
            // Use mock data in db-lite mode
            activeSearches = ACTIVE_SEARCHES.map((search) => ({
                id: search.id,
                marketplace: search.marketplace,
                params: search.filters
                    ? {
                        keywords: Array.isArray(search.filters.keywords)
                            ? search.filters.keywords
                            : [],
                        min_price: search.filters.minPrice,
                        max_price: search.filters.maxPrice,
                        condition: search.filters.condition,
                        location: search.filters.location,
                        category: search.filters.category,
                    }
                    : {
                        keywords: [],
                    },
                status: search.isActive ? "active" : "paused",
            }));
            console.log(`[INGEST] DB-LITE mode: Using ${activeSearches.length} mock searches`);
        }
        else {
            // Fetch from database in db-full mode
            if (!supabase) {
                throw new Error("Supabase client not initialized");
            }
            const { data: searches, error } = await supabase
                .from("saved_searches")
                .select("id, marketplace, params, status")
                .eq("status", "active")
                .order("created_at", { ascending: true, nullsFirst: true });
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
                marketplace: row.marketplace,
                params: row.params,
                status: row.status,
            }));
            console.log(`[INGEST] Found ${activeSearches.length} active searches`);
        }
        // Dispatch all searches using p-queue for concurrency control
        const runPromises = [];
        for (const search of activeSearches) {
            const queue = getMarketplaceQueue(search.marketplace);
            const runPromise = queue.add(async () => {
                const startedAt = Date.now();
                if (!search.params) {
                    console.warn("[INGEST] Missing params for search", { searchId: search.id });
                    return;
                }
                const keywordLabel = Array.isArray(search.params.keywords) && search.params.keywords.length > 0
                    ? search.params.keywords.join(" ")
                    : "search";
                console.log(`[INGEST] ▶️ ${search.marketplace} | ${keywordLabel}`);
                try {
                    if (!orchestrator) {
                        throw new Error("Orchestrator not initialized");
                    }
                    const config = searchToConfig(search);
                    const result = await orchestrator.runScraper(search.marketplace, config);
                    const durationMs = Date.now() - startedAt;
                    if (result.success) {
                        console.log(`[INGEST] ✅ ${search.marketplace}`, {
                            listingsFound: result.total_scraped,
                            durationMs
                        });
                        // Update database only in db-full mode
                        if (!IS_DB_LITE && supabase) {
                            const dealsPayload = buildDealsPayload(search, result.listings);
                            if (dealsPayload.length > 0) {
                                const { error: dealsError } = await supabase
                                    .from("deals")
                                    .upsert(dealsPayload, { onConflict: "search_id,url" });
                                if (dealsError) {
                                    console.warn("Failed to upsert deals", dealsError);
                                }
                            }
                        }
                    }
                    else {
                        const errorMsg = result.errors && result.errors.length > 0
                            ? result.errors[0]
                            : "Unknown error";
                        console.error(`[INGEST] ❌ ${search.marketplace}`, {
                            error: errorMsg
                        });
                    }
                }
                catch (error) {
                    console.error(`[INGEST] ❌ ${search.marketplace}`, {
                        error: error.message
                    });
                }
            });
            runPromises.push(runPromise);
        }
        // Wait for all runs to complete
        await Promise.allSettled(runPromises);
        console.log("[INGEST] Polling cycle complete");
    }
    catch (error) {
        console.error("[INGEST] Fatal error in pollActiveSearches:", error);
    }
}
//# sourceMappingURL=pollActiveSearches.js.map
