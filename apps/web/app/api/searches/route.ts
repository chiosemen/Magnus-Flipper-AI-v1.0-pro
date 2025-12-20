import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { createSupabaseServer } from "../../../lib/supabase/server";
import { inferAppRegionFromRequest, type AppRegion } from "../../../lib/appRegion";
import type { DealRow, SavedSearchRow } from "../../../lib/supabase/types";
import {
  dealMatchesSavedSearch,
  newestDealTimestamp,
  rankDealsForDisplay,
} from "@magnus-flipper-ai/deal-matching";
import { isMarketplaceSupportedInRegion } from "@magnus-flipper-ai/marketplace-config";

const MAX_SEARCHES = 25;
const MAX_DEALS_SCAN = 600;

function getSupabase() {
  try {
    return supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return null;
  }
}

function normalizeMarketplace(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function parseLimit(value: string | null): number {
  if (!value) return 10;
  const num = Number(value);
  if (!Number.isFinite(num)) return 10;
  return Math.max(1, Math.min(MAX_SEARCHES, Math.floor(num)));
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function imageFromDeal(deal: any): string | null {
  const direct = safeUrl(deal?.primary_image);
  if (direct) return direct;

  const images = Array.isArray(deal?.images) ? deal.images : [];
  const first = images
    .map((img: any) => safeUrl(img?.url ?? img))
    .find((url: any) => typeof url === "string" && url.length > 0);
  return first ?? null;
}

function isUnknownColumnOrTable(error: any): boolean {
  const code = typeof error?.code === "string" ? error.code : "";
  const message = typeof error?.message === "string" ? error.message : "";
  return (
    code === "42703" ||
    code === "42P01" ||
    message.toLowerCase().includes("does not exist") ||
    message.toLowerCase().includes("column") ||
    message.toLowerCase().includes("relation")
  );
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

async function loadDealsForMarketplaces({
  region,
  marketplaces,
  limit,
}: {
  region: AppRegion;
  marketplaces: string[];
  limit: number;
}): Promise<DealRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  if (marketplaces.length === 0) return [];

  const selectWithFetched =
    "id, region, marketplace, title, price, location, url, score, primary_image, images, thumbnail, attributes, data, created_at, fetched_at, posted_at";
  const selectLegacy =
    "id, marketplace, title, price, location, url, score, primary_image, images, thumbnail, data, created_at";

  let { data, error } = await supabase
    .from("deals")
    .select(selectWithFetched)
    .eq("region", region)
    .in("marketplace", marketplaces)
    // Pooled market state only (never depend on per-search deal rows).
    .is("search_id", null)
    .order("fetched_at", { ascending: false })
    .limit(limit);

  if (error && isUnknownColumnOrTable(error)) {
    const fallback = await supabase
      .from("deals")
      .select(selectLegacy)
      .in("marketplace", marketplaces)
      .is("search_id", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    data = fallback.data as any;
    error = fallback.error;
  }

  if (error) {
    console.warn("Failed to load deals for searches", error);
    return [];
  }

  return (Array.isArray(data) ? data : []) as DealRow[];
}

function buildSearchResponse({
  searches,
  deals,
}: {
  searches: SavedSearchRow[];
  deals: DealRow[];
}) {
  const dealsByMarketplace = new Map<string, DealRow[]>();
  for (const deal of deals) {
    const key =
      typeof deal.marketplace === "string" && deal.marketplace.trim().length > 0
        ? deal.marketplace.trim().toLowerCase()
        : "facebook";
    const list = dealsByMarketplace.get(key) ?? [];
    list.push(deal);
    dealsByMarketplace.set(key, list);
  }

  return searches.map((search) => {
    const marketplace =
      typeof search.marketplace === "string" && search.marketplace.trim().length > 0
        ? search.marketplace.trim().toLowerCase()
        : "facebook";

    const params = (search as any)?.params ?? {};
    const overrideMarketplaces: string[] = Array.isArray((params as any)?.marketplaces)
      ? ((params as any).marketplaces as any[])
          .map((m) => normalizeMarketplace(m))
          .filter((m): m is string => typeof m === "string" && m.length > 0)
      : [];

    const marketplacesToMatch =
      overrideMarketplaces.length > 0
        ? Array.from(new Set<string>(overrideMarketplaces)).slice(0, 8)
        : [marketplace];

    const candidateDeals = marketplacesToMatch.flatMap((m) => dealsByMarketplace.get(m) ?? []);
    const matched = candidateDeals.filter((deal) =>
      dealMatchesSavedSearch(deal as any, search as any)
    );

    const ranked = rankDealsForDisplay(matched as any) as DealRow[];
    const previewImages = ranked
      .map((deal) => imageFromDeal(deal))
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .slice(0, 4);

    return {
      ...search,
      deal_count: matched.length,
      preview_image: previewImages[0] ?? null,
      preview_images: previewImages.length > 0 ? previewImages : null,
      last_updated_at: newestDealTimestamp(ranked as any),
    };
  });
}

const FacebookBodySchema = z.object({
  marketplace: z.string().optional(),
  name: z.string().optional(),
  keywords: z.union([z.array(z.string()), z.string()]),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  maxDistanceMiles: z.number().optional(),
  condition: z.array(z.string()).optional(),
});

const CarsBodySchema = z.object({
  marketplace: z.literal("cars"),
  name: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  minYear: z.number().optional(),
  maxYear: z.number().optional(),
  maxMileage: z.number().optional(),
  maxPrice: z.number().optional(),
  location: z.string().optional(),
  radiusKm: z.number().optional(),
});

export async function GET(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const userId = await getUserId();
  const region = inferAppRegionFromRequest(req);
  const { searchParams } = new URL(req.url);
  const marketplaceFilter = normalizeMarketplace(searchParams.get("marketplace"));
  const limit = parseLimit(searchParams.get("limit"));

  let query = supabase
    .from("saved_searches")
    .select("id, user_id, region, name, marketplace, params, status, created_at, updated_at")
    .eq("status", "active")
    .eq("region", region)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (marketplaceFilter) {
    query = query.eq("marketplace", marketplaceFilter);
  }

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    const demoPublic = process.env.DEMO_PUBLIC === "true";
    if (!demoPublic) {
      return NextResponse.json({ searches: [] });
    }
    query = query.is("user_id", null);
  }

  const { data, error } = await query;
  let safeData: any = data;
  let safeError: any = error;
  if (safeError && isUnknownColumnOrTable(safeError)) {
    // Backward compatible fallback (pre-region schema).
    const fallback = await supabase
      .from("saved_searches")
      .select("id, user_id, name, marketplace, params, status, created_at, updated_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);
    safeData = fallback.data as any;
    safeError = fallback.error;
  }

  if (safeError) {
    console.error("Failed to load saved searches", safeError);
    return NextResponse.json(
      { error: "Failed to load saved searches" },
      { status: 500 }
    );
  }

  const searches = (Array.isArray(safeData) ? safeData : []).map((row: any) => ({
    ...row,
    region: row?.region ?? null,
  })) as SavedSearchRow[];
  const marketplaces = Array.from(
    searches.reduce<Set<string>>((acc, search: any) => {
      const m = normalizeMarketplace(search?.marketplace);
      if (m) acc.add(m);

      const params = search?.params ?? {};
      const overrides = Array.isArray(params?.marketplaces)
        ? params.marketplaces
            .map((v: any) => normalizeMarketplace(v))
            .filter((v: any): v is string => typeof v === "string" && v.length > 0)
        : [];
      for (const o of overrides) acc.add(o);

      return acc;
    }, new Set<string>())
  );

  const deals = await loadDealsForMarketplaces({
    region,
    marketplaces,
    limit: MAX_DEALS_SCAN,
  });

  const searchesWithPreviews = buildSearchResponse({ searches, deals });
  return NextResponse.json({ searches: searchesWithPreviews });
}

export async function POST(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const region = inferAppRegionFromRequest(req);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const marketplace = normalizeMarketplace(body?.marketplace) ?? "facebook";

  const includeOptional = process.env.ENABLE_SHPOCK === "true" || process.env.NEXT_PUBLIC_ENABLE_SHPOCK === "true";
  if (!isMarketplaceSupportedInRegion(marketplace, region, { includeOptional })) {
    return NextResponse.json({ error: "MARKETPLACE_NOT_SUPPORTED_IN_REGION" }, { status: 400 });
  }

  let searchName = "Saved search";
  let params: Record<string, any> = {};

  if (marketplace === "cars") {
    const parsed = CarsBodySchema.safeParse({ ...body, marketplace: "cars" });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid car search payload" },
        { status: 400 }
      );
    }

    const { make, model, minYear, maxYear, maxMileage, maxPrice, location, radiusKm } =
      parsed.data;

    params = {
      make: make?.trim() || null,
      model: model?.trim() || null,
      minYear: typeof minYear === "number" ? minYear : null,
      maxYear: typeof maxYear === "number" ? maxYear : null,
      maxMileage: typeof maxMileage === "number" ? maxMileage : null,
      maxPrice: typeof maxPrice === "number" ? maxPrice : null,
      location: location?.trim() || null,
      radiusKm: typeof radiusKm === "number" ? radiusKm : null,
    };

    searchName =
      typeof parsed.data.name === "string" && parsed.data.name.trim().length > 0
        ? parsed.data.name.trim()
        : `Car search - ${[make, model].filter(Boolean).join(" ") || "Any"}`;
  } else {
    const parsed = FacebookBodySchema.safeParse({ ...body, marketplace });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid search payload" },
        { status: 400 }
      );
    }

    const keywords =
      Array.isArray(parsed.data.keywords) && parsed.data.keywords.length > 0
        ? parsed.data.keywords
            .map((k) => String(k).trim())
            .filter((k) => k.length > 0)
        : typeof parsed.data.keywords === "string"
        ? parsed.data.keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0)
        : [];

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one keyword" },
        { status: 400 }
      );
    }

    params = {
      keywords,
      minPrice:
        typeof parsed.data.minPrice === "number" ? parsed.data.minPrice : undefined,
      maxPrice:
        typeof parsed.data.maxPrice === "number" ? parsed.data.maxPrice : undefined,
      maxDistanceMiles:
        typeof parsed.data.maxDistanceMiles === "number"
          ? parsed.data.maxDistanceMiles
          : undefined,
      condition: parsed.data.condition ?? [],
      query: keywords.join(" "),
    };

    searchName =
      typeof parsed.data.name === "string" && parsed.data.name.trim().length > 0
        ? parsed.data.name.trim()
        : `Search - ${keywords.join(", ")}`;
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("saved_searches")
    .insert([
      {
        user_id: userId,
        region,
        marketplace,
        name: searchName,
        params,
        status: "active",
        updated_at: nowIso,
      },
    ])
    .select("id, user_id, region, name, marketplace, params, status, created_at, updated_at")
    .single();

  if ((error && isUnknownColumnOrTable(error)) || !data) {
    // Backward compatible fallback (pre-region schema).
    const retry = await supabase
      .from("saved_searches")
      .insert([
        {
          user_id: userId,
          marketplace,
          name: searchName,
          params,
          status: "active",
          updated_at: nowIso,
        },
      ])
      .select("id, user_id, name, marketplace, params, status, created_at, updated_at")
      .single();

    if (retry.error || !retry.data) {
      console.error("Failed to save search", retry.error ?? error);
      return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
    }

    return NextResponse.json(
      {
        search: {
          ...(retry.data as SavedSearchRow),
          region,
          deal_count: 0,
          preview_image: null,
          preview_images: null,
          last_updated_at: null,
        },
      },
      { status: 201 }
    );
  }

  if (error) {
    console.error("Failed to save search", error);
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
  }

  return NextResponse.json(
    {
      search: {
        ...(data as SavedSearchRow),
        region,
        deal_count: 0,
        preview_image: null,
        preview_images: null,
        last_updated_at: null,
      },
    },
    { status: 201 }
  );
}
