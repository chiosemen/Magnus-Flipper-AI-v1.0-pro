import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type PlanRow = {
  id: string;
  name: string;
  max_concurrent_instant: number;
  max_concurrent_timed: number;
  daily_instant_credits: number;
  daily_timed_credits: number;
  marketplace_scope: "facebook" | "all" | string;
};

let _supabase: SupabaseClient | null = null;

function getSupabaseServiceClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase not configured (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required)"
    );
  }

  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

function toNumber(value: unknown): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : 0;
}

function isActiveStatus(status: unknown): boolean {
  if (typeof status !== "string") return false;
  const s = status.trim().toLowerCase();
  return s === "active" || s === "trialing";
}

export async function getUserPlanLimits(userId: string): Promise<PlanRow | null> {
  const supabase = getSupabaseServiceClient();

  const { data: sub, error: subError } = await supabase
    .from("user_subscriptions")
    .select("plan_id,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (subError) {
    console.error("[plans] Failed to load user_subscriptions", subError);
    return null;
  }

  const planId = (sub as any)?.plan_id as string | null | undefined;
  const status = (sub as any)?.status;
  if (!planId || !isActiveStatus(status)) return null;

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (planError) {
    console.error("[plans] Failed to load plan", planError);
    return null;
  }

  return {
    id: String((plan as any).id),
    name: String((plan as any).name),
    max_concurrent_instant: toNumber((plan as any).max_concurrent_instant),
    max_concurrent_timed: toNumber((plan as any).max_concurrent_timed),
    daily_instant_credits: toNumber((plan as any).daily_instant_credits),
    daily_timed_credits: toNumber((plan as any).daily_timed_credits),
    marketplace_scope: String((plan as any).marketplace_scope ?? "facebook"),
  };
}

export async function checkAndConsumeDailyCredit(
  userId: string,
  kind: "instant" | "timed"
): Promise<
  | { ok: true; plan: PlanRow }
  | { ok: false; reason: "NO_ACTIVE_PLAN" | "CREDITS_EXHAUSTED" | "USAGE_WRITE_FAILED" }
> {
  const plan = await getUserPlanLimits(userId);
  if (!plan) return { ok: false, reason: "NO_ACTIVE_PLAN" };

  const supabase = getSupabaseServiceClient();
  const day = new Date().toISOString().slice(0, 10);

  const { error: upsertError } = await supabase.from("user_search_usage_daily").upsert(
    {
      day,
      user_id: userId,
      instant_used: 0,
      timed_used: 0,
    },
    { onConflict: "day,user_id" }
  );

  if (upsertError) {
    console.error("[plans] Failed to upsert user_search_usage_daily", upsertError);
    return { ok: false, reason: "USAGE_WRITE_FAILED" };
  }

  const { data: usage, error: usageError } = await supabase
    .from("user_search_usage_daily")
    .select("*")
    .eq("day", day)
    .eq("user_id", userId)
    .single();

  if (usageError) {
    console.error("[plans] Failed to read user_search_usage_daily", usageError);
    return { ok: false, reason: "USAGE_WRITE_FAILED" };
  }

  const usedInstant = toNumber((usage as any)?.instant_used);
  const usedTimed = toNumber((usage as any)?.timed_used);

  const limit =
    kind === "instant"
      ? toNumber(plan.daily_instant_credits)
      : toNumber(plan.daily_timed_credits);
  const used = kind === "instant" ? usedInstant : usedTimed;

  // Convention:
  // - limit < 0 => unlimited
  // - limit >= 0 => enforce (0 means no credits)
  if (limit >= 0 && used >= limit) {
    return { ok: false, reason: "CREDITS_EXHAUSTED" };
  }

  const nextInstant = kind === "instant" ? usedInstant + 1 : usedInstant;
  const nextTimed = kind === "timed" ? usedTimed + 1 : usedTimed;

  const { error: updateError } = await supabase
    .from("user_search_usage_daily")
    .update({
      instant_used: nextInstant,
      timed_used: nextTimed,
      updated_at: new Date().toISOString(),
    })
    .eq("day", day)
    .eq("user_id", userId);

  if (updateError) {
    console.error("[plans] Failed to update user_search_usage_daily", updateError);
    return { ok: false, reason: "USAGE_WRITE_FAILED" };
  }

  return { ok: true, plan };
}

