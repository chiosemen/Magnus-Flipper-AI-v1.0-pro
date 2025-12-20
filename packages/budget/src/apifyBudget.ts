import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BudgetState = "OK" | "SOFT" | "HARD";

export type ApifyBudgetStatus = {
  day: string; // YYYY-MM-DD (UTC)
  currency: string;
  softCap: number;
  hardCap: number;
  allowCriticalAfterHard: boolean;
  spent: number;
  state: BudgetState;
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

export async function getApifyBudgetStatus(): Promise<ApifyBudgetStatus> {
  const supabase = getSupabaseServiceClient();
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  const { data: settings, error: settingsError } = await supabase
    .from("apify_budget_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (settingsError) {
    throw new Error(`Failed to load apify_budget_settings: ${settingsError.message}`);
  }

  const { data: ledger, error: ledgerError } = await supabase
    .from("apify_spend_ledger_daily")
    .select("*")
    .eq("day", day)
    .maybeSingle();

  if (ledgerError) {
    throw new Error(`Failed to load apify_spend_ledger_daily: ${ledgerError.message}`);
  }

  const spent = toNumber((ledger as any)?.spent_gbp ?? 0);
  const softCap = toNumber((settings as any)?.daily_soft_cap_gbp ?? 50);
  const hardCap = toNumber((settings as any)?.daily_hard_cap_gbp ?? 80);
  const allowCriticalAfterHard = Boolean((settings as any)?.allow_critical_after_hard ?? false);
  const currency = String((settings as any)?.currency ?? "GBP");

  const state: BudgetState =
    spent >= hardCap ? "HARD" : spent >= softCap ? "SOFT" : "OK";

  return {
    day,
    currency,
    softCap,
    hardCap,
    allowCriticalAfterHard,
    spent,
    state,
  };
}

export async function addApifySpendGBP(amountGBP: number) {
  if (!Number.isFinite(amountGBP) || amountGBP <= 0) return null;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc("apify_spend_add_gbp", {
    amount_gbp: amountGBP,
  });

  if (error) {
    throw new Error(`Failed to increment apify spend ledger: ${error.message}`);
  }

  return data;
}

