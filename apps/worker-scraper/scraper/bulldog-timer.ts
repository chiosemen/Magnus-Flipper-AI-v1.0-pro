/**
 * Azure Function: Bulldog ingestion timer
 * Periodically runs pollActiveSearches() but only for allowed tiers.
 *
 * IMPORTANT: This function is control-plane only (validate -> run poller -> return).
 * It MUST NOT introduce new scraping logic.
 */

import { app, InvocationContext, Timer } from "@azure/functions";
import { pollActiveSearches } from "@magnus-flipper-ai/scraper-sync";
import { supabase, supabaseServiceRoleKey, supabaseUrl } from "./supabase.js";

type SavedSearchRow = {
  id: string;
  user_id: string | null;
  created_at: string | null;
};

type SubscriptionRow = {
  user_id: string;
  tier: string | null;
};

const DEFAULT_ALLOWED_TIERS = ["free", "basic"] as const;
let bulldogTimerRunning = false;

function getAllowedTiers(): Set<string> {
  const raw = process.env.BULLDOG_ALLOWED_TIERS;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return new Set(
      raw
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    );
  }
  return new Set(DEFAULT_ALLOWED_TIERS);
}

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function fetchActiveSearches(context: InvocationContext): Promise<SavedSearchRow[]> {
  const { data, error } = await supabase
    .from("saved_searches")
    .select("id,user_id,created_at")
    .eq("status", "active")
    .order("created_at", { ascending: true, nullsFirst: true });

  if (error) {
    context.error("[BulldogTimer] Failed to fetch saved_searches", error);
    return [];
  }

  return (data ?? []) as SavedSearchRow[];
}

async function fetchUserTiers(
  userIds: string[],
  context: InvocationContext
): Promise<Map<string, string | null> | null> {
  const tiers = new Map<string, string | null>();
  if (userIds.length === 0) return tiers;

  for (const batch of chunk(userIds, 200)) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("user_id,tier")
      .in("user_id", batch);

    if (error) {
      context.error("[BulldogTimer] Failed to fetch subscriptions", error);
      return null;
    }

    for (const row of (data ?? []) as SubscriptionRow[]) {
      tiers.set(row.user_id, row.tier);
    }
  }

  return tiers;
}

export async function bulldogTimer(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  if (bulldogTimerRunning) {
    context.log("[BulldogTimer] Previous run still in progress; skipping.");
    return;
  }

  const startedAt = Date.now();
  context.log(`[BulldogTimer] Tick ${new Date().toISOString()}`);

  bulldogTimerRunning = true;
  try {
    // Fast exit if ingestion disabled (pollActiveSearches also enforces this).
    if (process.env.INGESTION_ENABLED !== "true") {
      context.log("[BulldogTimer] INGESTION_ENABLED is not true; skipping.");
      return;
    }

    const allowedTiers = getAllowedTiers();
    const searches = await fetchActiveSearches(context);

    if (searches.length === 0) {
      context.log("[BulldogTimer] No active searches found.");
      return;
    }

    const searchesWithUser = searches.filter((s) => Boolean(s.user_id));
    if (searchesWithUser.length === 0) {
      context.log("[BulldogTimer] No active searches with user_id found.");
      return;
    }

    const uniqueUserIds = Array.from(
      new Set(searchesWithUser.map((s) => s.user_id).filter(Boolean) as string[])
    );

    const userTiers = await fetchUserTiers(uniqueUserIds, context);
    if (!userTiers) {
      context.log("[BulldogTimer] Unable to resolve subscription tiers; skipping run.");
      return;
    }

    const eligibleSearchIds = searchesWithUser
      .filter((search) => {
        const userId = search.user_id as string;
        const tier = (userTiers.get(userId) ?? "free").toLowerCase();
        return allowedTiers.has(tier);
      })
      .map((search) => search.id);

    if (eligibleSearchIds.length === 0) {
      context.log("[BulldogTimer] No eligible searches for allowed tiers.", {
        allowedTiers: Array.from(allowedTiers),
      });
      return;
    }

    const previousSearchId = process.env.BULLDOG_SEARCH_ID;
    const previousMaxSearches = process.env.BULLDOG_MAX_SEARCHES;

    try {
      // Process deterministically in created_at order (already ordered in query).
      for (const searchId of eligibleSearchIds) {
        process.env.BULLDOG_SEARCH_ID = searchId;
        process.env.BULLDOG_MAX_SEARCHES = "1";

        context.log("[BulldogTimer] Running pollActiveSearches for search", {
          searchId,
        });

        await pollActiveSearches(supabaseUrl, supabaseServiceRoleKey);
      }
    } finally {
      if (previousSearchId === undefined) delete process.env.BULLDOG_SEARCH_ID;
      else process.env.BULLDOG_SEARCH_ID = previousSearchId;

      if (previousMaxSearches === undefined) delete process.env.BULLDOG_MAX_SEARCHES;
      else process.env.BULLDOG_MAX_SEARCHES = previousMaxSearches;
    }

    context.log("[BulldogTimer] Completed", {
      eligibleSearches: eligibleSearchIds.length,
      durationMs: Date.now() - startedAt,
    });
  } catch (error: any) {
    context.error("[BulldogTimer] Error", error);
    // Never crash the function host from the timer.
  } finally {
    bulldogTimerRunning = false;
  }
}

const globalKey = "__magnusBulldogTimerRegistered";
if (!(globalThis as any)[globalKey]) {
  (globalThis as any)[globalKey] = true;
  app.timer("bulldogTimer", {
    schedule: "0 */1 * * * *",
    handler: bulldogTimer,
  });
}
