import { createClient } from "@supabase/supabase-js";
import { fbScrapeQueue } from "@magnus-flipper-ai/queue";

type PoolRow = { id: string; pool_key: string; params: any; priority: number | null };
type RunRow = {
  pool_id: string;
  apify_run_id: string | null;
  status: string;
  listing_count: number | null;
  cost_estimate: number | null;
  started_at: string;
  finished_at: string | null;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toNumber(value: unknown): number | null {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : null;
}

async function main() {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    throw new Error("Redis not configured (set REDIS_URL or REDIS_HOST)");
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  if (!supabaseUrl) {
    throw new Error("Supabase not configured (set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)");
  }

  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const startedAtIso = new Date().toISOString();

  const { data: pools, error: poolsError } = await supabase
    .from("deal_pools")
    .select("id,pool_key,params,priority")
    .eq("marketplace", "facebook")
    .eq("enabled", true)
    .neq("status", "paused")
    .order("priority", { ascending: true })
    .limit(25);

  if (poolsError) throw new Error(`deal_pools lookup failed: ${poolsError.message}`);

  const poolRows = (pools ?? []) as PoolRow[];
  if (poolRows.length === 0) {
    console.log("No deal_pools found/enabled for facebook");
    return;
  }

  console.log(`Enqueueing one scrape per pool (${poolRows.length})...`);

  for (const pool of poolRows) {
    await fbScrapeQueue.add(
      "scrape-fb-pool",
      { type: "SCRAPE_FB_POOL", poolId: pool.id },
      {
        jobId: `seed-fb-pool:${pool.id}`,
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  }

  const poolIds = poolRows.map((p) => p.id);

  const deadlineMs = Date.now() + 30 * 60 * 1000;
  const seen = new Map<string, RunRow>();

  while (Date.now() < deadlineMs) {
    const { data: runs, error: runsError } = await supabase
      .from("fb_scrape_runs")
      .select(
        "pool_id,apify_run_id,status,listing_count,cost_estimate,started_at,finished_at"
      )
      .in("pool_id", poolIds)
      .gte("started_at", startedAtIso)
      .order("started_at", { ascending: false })
      .limit(200);

    if (runsError) throw new Error(`fb_scrape_runs lookup failed: ${runsError.message}`);

    for (const row of (runs ?? []) as RunRow[]) {
      if (!seen.has(row.pool_id)) {
        seen.set(row.pool_id, row);
      }
    }

    const done = poolIds.every((id) => {
      const run = seen.get(id);
      return Boolean(run?.finished_at);
    });

    if (done) break;
    await sleep(5_000);
  }

  console.log("Scrape results:");
  for (const pool of poolRows) {
    const run = seen.get(pool.id);
    const name =
      typeof pool?.params?.name === "string" && pool.params.name.trim().length > 0
        ? pool.params.name
        : pool.pool_key;
    if (!run) {
      console.log(JSON.stringify({ poolId: pool.id, name, status: "no_run_record" }));
      continue;
    }

    const startedMs = new Date(run.started_at).getTime();
    const finishedMs = run.finished_at ? new Date(run.finished_at).getTime() : NaN;
    const durationMs = Number.isFinite(startedMs) && Number.isFinite(finishedMs) ? finishedMs - startedMs : null;

    console.log(
      JSON.stringify({
        poolId: pool.id,
        name,
        status: run.status,
        listingCount: toNumber(run.listing_count) ?? 0,
        apifyRunId: run.apify_run_id,
        durationSeconds: durationMs !== null ? Math.round(durationMs / 1000) : null,
        costEstimateGBP: toNumber(run.cost_estimate),
      })
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
