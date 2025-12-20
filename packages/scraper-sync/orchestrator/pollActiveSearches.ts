/**
 * Active Search Poller
 * Polls active searches and dispatches scraper runs
 * 
 * This runs outside the web app (scraper-sync only).
 * Supports db-lite mode (no DB writes) and db-full mode (with DB writes).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ScraperOrchestrator } from "./scraperOrchestrator.js";
import type { ScraperConfig, ScrapedListing } from "../types/ScrapedListing.js";
import { IS_DB_LITE } from "../config/ingestionMode.js";
import { getMarketplaceQueue } from "../runtime/concurrency.js";
import { ACTIVE_SEARCHES } from "../dev/activeSearches.mock.js";
import { classifySeller, scoreCarDeal } from "@magnus-flipper-ai/scoring";

function normalizeMarketplace(
  marketplace: string
): ScrapedListing["marketplace"] {
  switch (marketplace.toLowerCase()) {
    case "facebook":
      return "facebook";
    case "gumtree":
      return "gumtree";
    case "craigslist":
      return "craigslist";
    case "ebay":
      return "ebay";
    case "vinted":
      return "vinted";
    case "depop":
      return "depop";
    default:
      return "facebook";
  }
}

/**
 * Active Search definition (matches SavedSearch model)
 */
interface ActiveSearch {
  id: string;
  marketplace: "facebook" | "vinted" | string;
  params?: {
    keywords?: string[];
    category?: string;
    min_price?: number;
    max_price?: number;
    condition?: string[];
    location?: string;
  } | null;
  status?: string | null;
}


/**
 * Convert ActiveSearch to ScraperConfig
 */
function searchToConfig(search: ActiveSearch): ScraperConfig {
  const {
    keywords,
    min_price,
    max_price,
    location,
    condition,
  } = search.params ?? {};

  const normalizedKeywords =
    Array.isArray(keywords) && keywords.length > 0
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

function parseCarYear(text: string | undefined): number | null {
  if (!text) return null;
  const match = text.match(/\b(19|20)\d{2}\b/);
  if (!match) return null;
  const year = Number(match[0]);
  return Number.isFinite(year) ? year : null;
}

function parseCarMileage(text: string | undefined): number | null {
  if (!text) return null;
  const normalized = text.toLowerCase();

  const milesMatch = normalized.match(/\b(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(miles|mile|mi)\b/);
  if (milesMatch) {
    const raw = milesMatch[1].replace(/,/g, "");
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  const kMilesMatch = normalized.match(/\b(\d{2,3}(?:\.\d)?)\s*k\s*(miles|mile|mi)\b/);
  if (kMilesMatch) {
    const value = Number(kMilesMatch[1]) * 1000;
    return Number.isFinite(value) ? Math.round(value) : null;
  }

  const kmMatch = normalized.match(/\b(\d{1,3}(?:,\d{3})+|\d{4,6})\s*km\b/);
  if (kmMatch) {
    const raw = kmMatch[1].replace(/,/g, "");
    const km = Number(raw);
    return Number.isFinite(km) ? Math.round(km * 0.621371) : null;
  }

  return null;
}

function buildDealsPayload(
  search: ActiveSearch,
  listings: ScrapedListing[]
): Array<Record<string, any>> {
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const searchMarketplace = String(search.marketplace || "").toLowerCase();
  const searchParams: any = search.params || {};
  const isCarSearch =
    searchMarketplace === "cars" ||
    typeof searchParams?.make === "string" ||
    typeof searchParams?.model === "string" ||
    typeof searchParams?.minYear === "number" ||
    typeof searchParams?.maxYear === "number";

  return listings
    .map((listing) => {
      const url = listing.link;
      if (!url || seen.has(url)) return null;
      seen.add(url);

      const createdAt =
        listing.timestamp && !Number.isNaN(Date.parse(listing.timestamp))
          ? new Date(listing.timestamp).toISOString()
          : now;

      let data: any = listing;
      if (isCarSearch) {
        const raw: any = (listing as any)?.raw_data ?? {};
        const sellerType = classifySeller({
          sellerName: (listing as any)?.seller_name,
          descriptionText: (listing as any)?.description,
          phoneNumber: raw?.phoneNumber ?? raw?.phone_number ?? null,
          listingCountBySeller: raw?.listingCountBySeller ?? raw?.listing_count_by_seller ?? null,
          profileType: raw?.profileType ?? raw?.profile_type ?? null,
        });

        const year =
          typeof raw?.year === "number"
            ? raw.year
            : parseCarYear(`${listing.title} ${listing.description || ""}`);
        const mileage =
          typeof raw?.mileage === "number"
            ? raw.mileage
            : parseCarMileage(`${listing.title} ${listing.description || ""}`);

        const estimatedResale =
          typeof raw?.estimatedResale === "number"
            ? raw.estimatedResale
            : typeof raw?.estimated_resale === "number"
            ? raw.estimated_resale
            : typeof raw?.estimated_resale_value === "number"
            ? raw.estimated_resale_value
            : null;

        const { dealScore, breakdown } = scoreCarDeal({
          askingPrice: listing.price,
          estimatedResale,
          year,
          mileage,
          make: typeof searchParams?.make === "string" ? searchParams.make : raw?.make,
          model: typeof searchParams?.model === "string" ? searchParams.model : raw?.model,
          descriptionText: listing.description,
          sellerType,
          motStatus: raw?.motStatus ?? raw?.mot_status ?? null,
          transmission: raw?.transmission ?? null,
          location: listing.location,
        });

        data = {
          ...listing,
          scoring: {
            dealScore,
            breakdown,
            sellerType,
          },
        };
      }

      return {
        search_id: search.id,
        marketplace: listing.marketplace || search.marketplace,
        title: listing.title,
        price: Number.isFinite(listing.price) ? listing.price : null,
        currency: listing.currency || "USD",
        location: listing.location,
        url,
        data,
        created_at: createdAt,
      };
    })
    .filter(Boolean) as Array<Record<string, any>>;
}

/**
 * Poll active searches and dispatch scraper runs
 */
export async function pollActiveSearches(
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<void> {
  // Guardrail (pooled-only cutover):
  // Per-search ingestion is considered legacy and must be explicitly enabled in controlled environments.
  const legacyEnabled = process.env.ENABLE_LEGACY_SCRAPERS === "true";
  if (!legacyEnabled) {
    console.log("[INGEST] Legacy scrapers disabled via ENABLE_LEGACY_SCRAPERS. Exiting safely.");
    return;
  }

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
      activeSearches = (ACTIVE_SEARCHES as any[]).map((search) => ({
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
    } else {
      // Fetch from database in db-full mode
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const targetSearchId =
        typeof process.env.BULLDOG_SEARCH_ID === "string" &&
        process.env.BULLDOG_SEARCH_ID.trim().length > 0
          ? process.env.BULLDOG_SEARCH_ID.trim()
          : null;

      const targetMarketplace =
        typeof process.env.BULLDOG_MARKETPLACE === "string" &&
        process.env.BULLDOG_MARKETPLACE.trim().length > 0
          ? process.env.BULLDOG_MARKETPLACE.trim()
          : null;

      const maxSearchesRaw =
        typeof process.env.BULLDOG_MAX_SEARCHES === "string"
          ? process.env.BULLDOG_MAX_SEARCHES.trim()
          : "";
      const maxSearches =
        maxSearchesRaw && Number.isFinite(Number(maxSearchesRaw))
          ? Math.max(1, Math.floor(Number(maxSearchesRaw)))
          : null;

      let searchesQuery = supabase
        .from("saved_searches")
        .select("id, marketplace, params, status")
        .eq("status", "active")
        .order("created_at", { ascending: true, nullsFirst: true });

      if (targetSearchId) {
        searchesQuery = searchesQuery.eq("id", targetSearchId);
      }

      if (targetMarketplace) {
        searchesQuery = searchesQuery.eq("marketplace", targetMarketplace);
      }

      if (maxSearches) {
        searchesQuery = searchesQuery.limit(maxSearches);
      }

      const { data: searches, error } = await searchesQuery;

      if (error) {
        console.error("[INGEST] Error fetching active searches:", error);
        return;
      }

      if (!searches || searches.length === 0) {
        console.log("[INGEST] No active searches found.");
        return;
      }

      if (targetSearchId && searches.length !== 1) {
        console.warn("[INGEST] BULLDOG_SEARCH_ID expected 1 row", {
          targetSearchId,
          found: searches.length,
        });
      }

      activeSearches = searches.map((row: any) => ({
        id: row.id,
        marketplace: row.marketplace,
        params: row.params,
        status: row.status,
      }));

      console.log(`[INGEST] Found ${activeSearches.length} active searches`);
    }

    // Dispatch all searches using p-queue for concurrency control
    const runPromises: Promise<void>[] = [];

    for (const search of activeSearches) {
      // Guardrail: Facebook Marketplace is pooled-only. Skip any per-search Facebook jobs here.
      if (normalizeMarketplace(search.marketplace) === "facebook") {
        console.warn("[INGEST] Skipping facebook search (pooled-only)", { searchId: search.id });
        continue;
      }

      const queue = getMarketplaceQueue(search.marketplace);
      if (!search.params) {
        console.warn("[INGEST] Missing params for search", { searchId: search.id });
        continue;
      }

      const keywordLabel =
        Array.isArray(search.params.keywords) && search.params.keywords.length > 0
          ? search.params.keywords.join(" ")
          : "search";

      const runPromise = queue.add(async () => {
        const startedAt = Date.now();

        console.log(`[INGEST] ▶️ ${search.marketplace} | ${keywordLabel}`);

        try {
          if (!orchestrator) {
            throw new Error("Orchestrator not initialized");
          }

          const config = searchToConfig(search);
          const useFakeListings = process.env.BULLDOG_FAKE_LISTINGS === "true";
          const fakeNow = new Date().toISOString();
          const fakeListing: ScrapedListing = {
            title: `[BULLDOG_TEST] ${keywordLabel}`,
            price: 100,
            currency: "USD",
            link: `https://example.com/bulldog/${encodeURIComponent(search.id)}`,
            images: [],
            seller_id: "bulldog-test",
            timestamp: fakeNow,
            location:
              typeof search.params?.location === "string"
                ? search.params.location
                : undefined,
            condition: "unknown",
            marketplace: normalizeMarketplace(search.marketplace),
            raw_data: {
              bulldog_test: true,
              search_id: search.id,
            },
          };
          const result = useFakeListings
            ? {
                marketplace: search.marketplace,
                success: true,
                listings: [fakeListing],
                total_scraped: 1,
                errors: [],
                started_at: fakeNow,
                completed_at: fakeNow,
                duration_ms: 0,
              }
            : await orchestrator.runScraper(search.marketplace, config);

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

                  const canonicalDealsPayload = dealsPayload.map((row) => ({
                    search_id: row.search_id,
                    marketplace: row.marketplace,
                    data: row.data,
                    created_at: row.created_at,
                  }));

                  const { error: insertError } = await supabase
                    .from("deals")
                    .insert(canonicalDealsPayload);

                  if (insertError) {
                    console.warn("Failed to insert deals fallback", insertError);
                  }
                }
              }
            }
          } else {
            const errorMsg = result.errors && result.errors.length > 0 
              ? result.errors[0] 
              : "Unknown error";
            console.error(`[INGEST] ❌ ${search.marketplace}`, {
              error: errorMsg
            });
          }
        } catch (error: any) {
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
  } catch (error: any) {
    console.error("[INGEST] Fatal error in pollActiveSearches:", error);
  }
}
