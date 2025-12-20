import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { createSupabaseServer } from "../../../../lib/supabase/server";
import type { SavedSearchRow } from "../../../../lib/supabase/types";
import { blockUnlessDevAdmin } from "../../_lib/legacyScrapeGate";

function getSupabase() {
  try {
    return supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return null;
  }
}

function parseNumber(value: any) {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : null;
}

function normalizeMarketplace(value: any) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

async function getUserId() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch (error) {
    console.warn("Supabase user lookup failed", error);
    return null;
  }
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
  // Deprecated: legacy Facebook saved-search route (service-role). Kept for local debugging only.
  // Guardrail: production must never allow unauthenticated service-role writes/reads that bypass RLS.
  const blocked = blockUnlessDevAdmin(req);
  if (blocked) return blocked;

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const userId = await getUserId();
  let query = supabase
    .from("saved_searches")
    .select(
      "id, user_id, name, marketplace, params, status, created_at, deals(count)"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load saved searches", error);
    return NextResponse.json(
      { error: "Failed to load saved searches" },
      { status: 500 }
    );
  }

  const searches =
    data?.map((row: any) => {
      const { deals, ...rest } = row || {};
      return {
        ...rest,
        deal_count: Array.isArray(deals) ? deals[0]?.count ?? 0 : 0,
      };
    }) || [];

  const searchIds = searches
    .map((row: any) => row?.id)
    .filter((value: any): value is string => typeof value === "string" && value.length > 0);

  const previewImagesBySearchId = new Map<string, string[]>();
  if (searchIds.length > 0) {
    await Promise.all(
      searchIds.map(async (searchId) => {
        const { data: latestDeals, error: latestError } = await supabase
          .from("deals")
          .select("primary_image, created_at")
          .eq("search_id", searchId)
          .order("created_at", { ascending: false })
          .limit(4);

        if (latestError) {
          if (isUnknownColumnError(latestError)) {
            previewImagesBySearchId.set(searchId, []);
            return;
          }
          console.warn("Failed to load preview image for search", {
            searchId,
            error: latestError,
          });
          previewImagesBySearchId.set(searchId, []);
          return;
        }

        const images = Array.isArray(latestDeals)
          ? (latestDeals as any[])
              .map((deal) => safeUrl(deal?.primary_image))
              .filter((value): value is string => typeof value === "string" && value.length > 0)
          : [];

        previewImagesBySearchId.set(searchId, images.slice(0, 4));
      })
    );
  }

  const searchesWithPreview = searches.map((row: any) => ({
    ...row,
    preview_image: previewImagesBySearchId.get(row.id)?.[0] ?? null,
    preview_images:
      previewImagesBySearchId.get(row.id) && previewImagesBySearchId.get(row.id)!.length > 0
        ? previewImagesBySearchId.get(row.id)!
        : null,
  }));

  return NextResponse.json({ searches: searchesWithPreview as SavedSearchRow[] });
}

export async function POST(req: Request) {
  // Deprecated: legacy Facebook saved-search route (service-role). Kept for local debugging only.
  // Guardrail: production must never allow unauthenticated service-role writes/reads that bypass RLS.
  const blocked = blockUnlessDevAdmin(req);
  if (blocked) return blocked;

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const marketplace = normalizeMarketplace(body.marketplace) ?? "facebook";
  const userId = await getUserId();

  // NOTE: This endpoint only stores saved_searches rows (no scraping / no deal reads).
  // TODO(car-pooling): When car pooling is implemented, add an explicit pool registry + ingestion path
  // for marketplace='cars' (separate from this control-plane insert endpoint).
  // TODO(bulldog): When a car ingestion worker exists, read marketplace='cars' searches and write deals
  // (never trigger scraping from web pages or API routes).

  let params: Record<string, any> = {};
  let searchName = "Saved search";

  if (marketplace === "cars") {
    const make = typeof body.make === "string" ? body.make.trim() : "";
    const model = typeof body.model === "string" ? body.model.trim() : "";

    const minYear = parseNumber(body.minYear);
    const maxYear = parseNumber(body.maxYear);
    const maxMileage = parseNumber(body.maxMileage);
    const maxPrice = parseNumber(body.maxPrice);
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const radiusKm = parseNumber(body.radiusKm);

    params = {
      make: make || null,
      model: model || null,
      minYear,
      maxYear,
      maxMileage,
      maxPrice,
      location: location || null,
      radiusKm,
    };

    searchName =
      typeof body.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : `Car search - ${[make, model].filter(Boolean).join(" ") || "Any"}`;
  } else {
    const keywords =
      Array.isArray(body.keywords) && body.keywords.length > 0
        ? body.keywords.map((k: any) => String(k).trim()).filter(Boolean)
        : typeof body.keywords === "string"
        ? body.keywords
            .split(",")
            .map((k: string) => k.trim())
            .filter(Boolean)
        : [];

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one keyword" },
        { status: 400 }
      );
    }

    const minPrice = parseNumber(body.minPrice);
    const maxPrice = parseNumber(body.maxPrice);
    const maxDistanceMiles = parseNumber(body.maxDistanceMiles);
    const condition = Array.isArray(body.condition)
      ? body.condition.map((c: any) => String(c)).filter(Boolean)
      : [];

    params = {
      keywords,
      minPrice: minPrice ?? undefined,
      maxPrice: maxPrice ?? undefined,
      maxDistanceMiles: maxDistanceMiles ?? undefined,
      condition,
      query: keywords.join(" "),
    };

    searchName =
      typeof body.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : `Facebook search - ${keywords.join(", ")}`;
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .insert([
      {
        user_id: userId,
        marketplace,
        name: searchName,
        params,
        status: "active",
      },
    ])
    .select("id, user_id, name, marketplace, params, status, created_at")
    .single();

  if (error || !data) {
    console.error("Failed to save search", error);
    return NextResponse.json(
      { error: "Failed to save search" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { search: { ...(data as SavedSearchRow), deal_count: 0 } },
    { status: 201 }
  );
}
