import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { status: "unknown", scansRemaining: 0 },
      { status: 200 }
    );
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json(
      { status: "anon", scansRemaining: 0 },
      { status: 200 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await supabase
    .from("scan_entitlements")
    .select("scans_remaining, expires_at, marketplaces")
    .eq("user_id", userId);

  if (error || !data) {
    return NextResponse.json(
      { status: "unknown", scansRemaining: 0 },
      { status: 200 }
    );
  }

  const now = Date.now();
  const remaining = data
    .filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now)
    .reduce((sum, r) => sum + (r.scans_remaining ?? 0), 0);

  return NextResponse.json(
    {
      status: remaining > 0 ? "has_credits" : "no_credits",
      scansRemaining: remaining,
    },
    { status: 200 }
  );
}
