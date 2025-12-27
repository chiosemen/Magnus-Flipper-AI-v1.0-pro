import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getExecutionMode,
  isExecutionAllowedForRequest,
} from "@/lib/execution/edge-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ ok: false, reason: "env_missing" }, { status: 200 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const body = (await req.json().catch(() => ({}))) as {
    user_id?: string;
    marketplace?: string;
  };

  const userId = body.user_id;
  const marketplace = body.marketplace;

  if (!userId || !marketplace) {
    return NextResponse.json({ ok: false, reason: "missing_params" }, { status: 400 });
  }

  const mode = await getExecutionMode();
  let isAdmin = false;

  if (mode === "admin") {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (!profileError && profile?.is_admin && profile?.role === "admin") {
      isAdmin = true;
    }
  }

  if (!isExecutionAllowedForRequest({ mode, isAdmin })) {
    return NextResponse.json(
      { ok: false, reason: "execution_not_allowed", mode },
      { status: 200 }
    );
  }

  const { data, error } = await supabase.rpc("decrement_scan", {
    p_user_id: userId,
    p_marketplace: marketplace,
  });

  if (error || !data || !Array.isArray(data) || !data[0]?.ok) {
    // Best-effort ledger write (do not block response)
    const { error: ledgerError } = await supabase
      .from("scan_ledger")
      .insert({
        user_id: userId,
        event: "scan_blocked_no_credits",
        marketplace,
        meta: { reason: error?.message ?? "no_credits" },
      });
    if (ledgerError) {
      console.warn("scan_ledger insert failed", ledgerError);
    }
    return NextResponse.json({ ok: false, reason: "no_credits" }, { status: 200 });
  }

  const result = data[0] as { ok: boolean; remaining_scans: number; entitlement_id: string };

  let planTier: string | undefined;
  if (result.entitlement_id) {
    const { data: entitlementRow, error: entitlementError } = await supabase
      .from("scan_entitlements")
      .select("plan_tier")
      .eq("id", result.entitlement_id)
      .maybeSingle();

    if (entitlementError) {
      console.warn("scan_entitlements lookup failed", entitlementError);
    } else {
      planTier = entitlementRow?.plan_tier ?? undefined;
    }
  }

  const { error: ledgerStartError } = await supabase
    .from("scan_ledger")
    .insert({
      user_id: userId,
      event: "scan_start",
      marketplace,
      entitlement_id: result.entitlement_id,
      meta: { remaining_scans: result.remaining_scans },
    });
  if (ledgerStartError) {
    console.warn("scan_ledger insert failed", ledgerStartError);
  }

  return NextResponse.json(
    {
      ok: true,
      remaining_scans: result.remaining_scans,
      entitlement_id: result.entitlement_id,
      plan_tier: planTier,
    },
    { status: 200 }
  );
}
