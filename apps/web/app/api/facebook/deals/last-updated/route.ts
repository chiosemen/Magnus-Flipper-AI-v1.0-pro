import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase/admin";
import { inferAppRegionFromRequest } from "../../../../../lib/appRegion";

const MARKETPLACE = "facebook";

function getSupabase() {
  try {
    return supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return null;
  }
}

export async function GET(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }
  const region = inferAppRegionFromRequest(req);

  const { data: pooled, error } = await supabase
    .from("deals")
    .select("created_at")
    .eq("region", region)
    .eq("marketplace", MARKETPLACE)
    .is("search_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load last updated timestamp", error);
    return NextResponse.json(
      { error: "Failed to load last updated timestamp" },
      { status: 500 }
    );
  }

  if (typeof pooled?.created_at === "string" && pooled.created_at.length > 0) {
    return NextResponse.json({
      lastUpdatedAt: pooled.created_at,
    });
  }

  const demoFilters: Array<Record<string, any>> = [
    { demo: true },
    { data: { demo: true } },
  ];

  const demoCandidates: Array<string | null | undefined> = [];
  for (const filter of demoFilters) {
    const { data, error } = await supabase
      .from("deals")
      .select("created_at")
      .eq("region", region)
      .eq("marketplace", MARKETPLACE)
      .contains("data", filter)
      .is("search_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Failed to load demo last-updated timestamp", error);
      continue;
    }

    demoCandidates.push(data?.created_at);
  }

  const candidates = demoCandidates
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => ({
      value,
      ts: new Date(value).getTime(),
    }))
    .filter((entry) => Number.isFinite(entry.ts))
    .sort((a, b) => b.ts - a.ts);

  return NextResponse.json({
    lastUpdatedAt: candidates[0]?.value ?? null,
  });
}
