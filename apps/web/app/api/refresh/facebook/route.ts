import { NextResponse } from "next/server";
import { fbScrapeQueue, redis } from "@magnus-flipper-ai/queue";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { createSupabaseServer } from "../../../../lib/supabase/server";
import { blockUnlessDevAdmin } from "../../_lib/legacyScrapeGate";

export const runtime = "nodejs";

type RefreshKind = "instant" | "timed";

function toNumber(value: unknown): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : 0;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return false;
}

function isActiveStatus(status: unknown): boolean {
  if (typeof status !== "string") return false;
  const value = status.trim().toLowerCase();
  return value === "active" || value === "trialing";
}

function looksLikeUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

async function getAuthedUserId(req: Request): Promise<string | null> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // Ignore cookie auth errors; fall back to bearer auth if provided.
  }

  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1]?.trim();
  if (!token) return null;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;

  return data?.user?.id ?? null;
}

export async function POST(req: Request) {
  // Deprecated: web routes must not enqueue scraping jobs. Pooled scrapes are scheduled by workers only.
  const blocked = blockUnlessDevAdmin();
  if (blocked) return blocked;

  // This route enqueues work via BullMQ/Redis; it cannot run in environments without Redis.
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    return NextResponse.json(
      { error: "REDIS_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  let userId: string | null = null;
  try {
    userId = await getAuthedUserId(req);
  } catch (error) {
    console.error("Auth failed in refresh route", error);
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const poolId = body?.poolId;
  if (!looksLikeUuid(poolId)) {
    return NextResponse.json({ error: "POOL_ID_REQUIRED" }, { status: 400 });
  }

  const isInstant = parseBoolean(body?.isInstant);
  const kind: RefreshKind = isInstant ? "instant" : "timed";

  let supabase: ReturnType<typeof supabaseAdmin>;
  try {
    supabase = supabaseAdmin();
  } catch (error) {
    console.error("Supabase admin unavailable in refresh route", error);
    return NextResponse.json(
      { error: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  // 1) Validate pool existence/availability (fast, non-scraping).
  const { data: pool, error: poolError } = await supabase
    .from("deal_pools")
    .select("id, marketplace, enabled, status")
    .eq("id", poolId)
    .maybeSingle();

  if (poolError) {
    console.error("Failed to load deal_pools row", poolError);
    return NextResponse.json({ error: "POOL_LOOKUP_FAILED" }, { status: 500 });
  }

  if (!pool) {
    return NextResponse.json({ error: "POOL_NOT_FOUND" }, { status: 404 });
  }

  if (String((pool as any).marketplace ?? "").toLowerCase() !== "facebook") {
    return NextResponse.json({ error: "POOL_MARKETPLACE_MISMATCH" }, { status: 400 });
  }

  if (!(pool as any).enabled) {
    return NextResponse.json({ error: "POOL_DISABLED" }, { status: 409 });
  }

  const poolStatus = String((pool as any).status ?? "").toLowerCase();
  if (poolStatus === "paused") {
    return NextResponse.json({ error: "POOL_PAUSED" }, { status: 409 });
  }

  // 2) Load subscription + plan.
  const { data: subscription, error: subError } = await supabase
    .from("user_subscriptions")
    .select("plan_id,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (subError) {
    console.error("Failed to load user_subscriptions", subError);
    return NextResponse.json(
      { error: "SUBSCRIPTION_LOOKUP_FAILED" },
      { status: 500 }
    );
  }

  const planId = (subscription as any)?.plan_id as string | null | undefined;
  const status = (subscription as any)?.status;
  if (!planId || !isActiveStatus(status)) {
    return NextResponse.json({ error: "NO_ACTIVE_PLAN" }, { status: 403 });
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      "id,name,max_concurrent_instant,max_concurrent_timed,daily_instant_credits,daily_timed_credits,marketplace_scope"
    )
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    console.error("Failed to load plan", planError);
    return NextResponse.json({ error: "PLAN_LOOKUP_FAILED" }, { status: 500 });
  }

  const marketplaceScope = String((plan as any).marketplace_scope ?? "facebook");
  if (marketplaceScope !== "facebook" && marketplaceScope !== "all") {
    return NextResponse.json({ error: "PLAN_SCOPE_FORBIDDEN" }, { status: 403 });
  }

  // 3) Soft concurrency gate (read/cleanup only; actual enforcement still happens in the worker).
  const limit =
    kind === "instant"
      ? toNumber((plan as any).max_concurrent_instant)
      : toNumber((plan as any).max_concurrent_timed);

  if (!Number.isFinite(limit) || limit <= 0) {
    return NextResponse.json(
      { error: kind === "instant" ? "INSTANT_NOT_ALLOWED" : "TIMED_NOT_ALLOWED" },
      { status: 403 }
    );
  }

  const leaseTtlMs = Number(process.env.FB_SCRAPE_LEASE_TTL_MS ?? 10 * 60 * 1000);
  const semKey = `sem:user:${userId}:${kind}`;

  try {
    const now = Date.now();
    await redis.zremrangebyscore(semKey, 0, now - leaseTtlMs);
    const current = await redis.zcard(semKey);
    if (toNumber(current) >= limit) {
      return NextResponse.json(
        { error: "CONCURRENCY_LIMIT_REACHED" },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error("Failed to check Redis semaphore", error);
    return NextResponse.json(
      { error: "CONCURRENCY_CHECK_FAILED" },
      { status: 503 }
    );
  }

  // 4) Soft credit gate (read-only). Worker is authoritative for consumption.
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const { data: usage, error: usageError } = await supabase
    .from("user_search_usage_daily")
    .select("instant_used,timed_used")
    .eq("day", day)
    .eq("user_id", userId)
    .maybeSingle();

  if (usageError) {
    console.error("Failed to load user_search_usage_daily", usageError);
    return NextResponse.json(
      { error: "USAGE_LOOKUP_FAILED" },
      { status: 500 }
    );
  }

  const used =
    kind === "instant"
      ? toNumber((usage as any)?.instant_used ?? 0)
      : toNumber((usage as any)?.timed_used ?? 0);
  const dailyLimit =
    kind === "instant"
      ? toNumber((plan as any).daily_instant_credits)
      : toNumber((plan as any).daily_timed_credits);

  // Convention:
  // - dailyLimit < 0 => unlimited
  // - dailyLimit >= 0 => enforce (0 means none)
  if (dailyLimit >= 0 && used >= dailyLimit) {
    return NextResponse.json({ error: "CREDITS_EXHAUSTED" }, { status: 429 });
  }

  // 5) Enqueue job (non-blocking).
  try {
    const job = await fbScrapeQueue.add(
      "scrape-fb-pool",
      {
        type: "SCRAPE_FB_POOL",
        poolId,
        requestedByUserId: userId,
        isInstant,
      },
      {
        jobId: `refresh:${userId}:${poolId}:${kind}`,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
      }
    );

    return NextResponse.json(
      {
        status: "QUEUED",
        poolId,
        isInstant,
        jobId: String(job.id),
        etaMinutes: isInstant ? 2 : 5,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Failed to enqueue fb-scrape job", error);
    return NextResponse.json({ error: "ENQUEUE_FAILED" }, { status: 500 });
  }
}
