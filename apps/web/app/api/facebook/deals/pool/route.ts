import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase/admin";
import { inferAppRegionFromRequest } from "../../../../../lib/appRegion";
import type { DealRow } from "../../../../../lib/supabase/types";

const MARKETPLACE = "facebook";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const DEAL_FIELDS_WITH_IMAGES =
  "id, search_id, region, marketplace, title, price, currency, score, location, url, images, primary_image, thumbnail, data, created_at, fetched_at";
const DEAL_FIELDS_LEGACY =
  "id, search_id, marketplace, title, price, currency, score, location, url, data, created_at";

function getSupabase() {
  try {
    return supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return null;
  }
}

function parseLimit(value: string | null) {
  if (!value) return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(parsed)));
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
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = parseLimit(searchParams.get("limit"));
  const region = inferAppRegionFromRequest(req);

  let selectFields = DEAL_FIELDS_WITH_IMAGES;
  const pooledResponse = await supabase
    .from("deals")
    .select(selectFields)
    .eq("region", region)
    .eq("marketplace", MARKETPLACE)
    .is("search_id", null)
    .order("fetched_at", { ascending: false })
    .limit(limit);

  let pooledDeals = (pooledResponse.data as any[] | null) ?? null;
  let error = pooledResponse.error;

  if (error && isUnknownColumnError(error)) {
    selectFields = DEAL_FIELDS_LEGACY;
    const fallback = await supabase
      .from("deals")
      .select(selectFields)
      .eq("marketplace", MARKETPLACE)
      .is("search_id", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    pooledDeals = Array.isArray(fallback.data)
      ? fallback.data.map((row: any) => ({
          ...row,
          images: null,
          primary_image: null,
          thumbnail: null,
        }))
      : null;
    error = fallback.error;
  }

  if (error) {
    console.error("Failed to load pooled deals", error);
    return NextResponse.json(
      { error: "Failed to load pooled deals" },
      { status: 500 }
    );
  }

  const combined: DealRow[] = [...((pooledDeals || []) as DealRow[])];

  // Demo/seed fallback: only when no real pooled deals exist
  if (combined.length === 0) {
    const demoFilters: Array<Record<string, any>> = [
      { demo: true },
      { data: { demo: true } },
    ];

    for (const filter of demoFilters) {
      const { data, error } = await supabase
        .from("deals")
        .select(selectFields)
        .contains("data", filter)
        .is("search_id", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.warn("Failed to load demo deals", error);
        continue;
      }

      if (Array.isArray(data) && data.length > 0) {
        const normalized =
          selectFields === DEAL_FIELDS_LEGACY
            ? (data as any[]).map((row) => ({
                ...row,
                images: null,
                primary_image: null,
                thumbnail: null,
              }))
            : data;
        combined.push(...(normalized as DealRow[]));
      }
    }
  }

  const uniqueById = new Map<string, DealRow>();
  for (const deal of combined) {
    uniqueById.set(deal.id, deal);
  }

  const sorted = Array.from(uniqueById.values()).sort((a, b) => {
    const aTs = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTs = b.created_at ? new Date(b.created_at).getTime() : 0;
    return (Number.isFinite(bTs) ? bTs : 0) - (Number.isFinite(aTs) ? aTs : 0);
  });

  return NextResponse.json({ deals: sorted.slice(0, limit) });
}
