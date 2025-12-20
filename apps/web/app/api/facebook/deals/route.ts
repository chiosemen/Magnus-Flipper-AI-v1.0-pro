import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import type { DealRow } from "../../../../lib/supabase/types";
import { blockUnlessDevAdmin } from "../../_lib/legacyScrapeGate";

function getSupabase() {
  try {
    return supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return null;
  }
}

function isUnknownColumnError(error: any): boolean {
  const code = typeof error?.code === "string" ? error.code : "";
  const message = typeof error?.message === "string" ? error.message : "";
  return (
    code === "42703" ||
    message.toLowerCase().includes("does not exist") ||
    message.toLowerCase().includes("column")
  );
}

export async function GET(req: Request) {
  // Deprecated: legacy per-search deals endpoint (search_id-based).
  // Guardrail: pooled-only architecture uses `/api/deals` (search params match), not `search_id`.
  const blocked = blockUnlessDevAdmin(req);
  if (blocked) return blocked;

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const searchId = searchParams.get("searchId");

  if (!searchId) {
    return NextResponse.json(
      { error: "Missing searchId parameter" },
      { status: 400 }
    );
  }

  const SELECT_FIELDS_WITH_IMAGES =
    "id, search_id, marketplace, title, price, currency, score, location, url, images, primary_image, thumbnail, data, created_at";
  const SELECT_FIELDS_LEGACY =
    "id, search_id, marketplace, title, price, currency, score, location, url, data, created_at";

  let query = supabase
    .from("deals")
    .select(SELECT_FIELDS_WITH_IMAGES)
    .eq("search_id", searchId)
    .order("created_at", { ascending: false })
    .limit(50);

  let { data, error } = await query;

  if (error && isUnknownColumnError(error)) {
    const fallback = await supabase
      .from("deals")
      .select(SELECT_FIELDS_LEGACY)
      .eq("search_id", searchId)
      .order("created_at", { ascending: false })
      .limit(50);

    data =
      fallback.data?.map((row: any) => ({
        ...row,
        images: null,
        primary_image: null,
        thumbnail: null,
      })) ?? null;
    error = fallback.error;
  }

  if (error) {
    console.error("Failed to load deals for search", error);
    return NextResponse.json(
      { error: "Failed to load deals for search" },
      { status: 500 }
    );
  }

  return NextResponse.json({ deals: (data || []) as DealRow[] });
}
