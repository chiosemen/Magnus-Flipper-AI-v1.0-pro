import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { createSupabaseServer } from "../../../lib/supabase/server";
import { inferAppRegionFromRequest, type AppRegion } from "../../../lib/appRegion";
import type { DealRow, SavedSearchRow } from "../../../lib/supabase/types";
import { dealMatchesSavedSearch, rankDealsForDisplay } from "@magnus-flipper-ai/deal-matching";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_DEALS_SCAN = 800;

type UserBlockRow = {
  marketplace: string;
  type: "seller" | "location" | "keyword" | string;
  value: string;
};

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

async function getUser() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch (error) {
    console.warn("Supabase user lookup failed", error);
    return null;
  }
}

function safeLower(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function escapeLikePattern(value: string): string {
  // PostgREST uses PostgreSQL LIKE patterns. Keep this conservative to avoid accidental wildcards.
  return value.replace(/[%_]/g, "");
}

async function loadUserBlocksForMarketplace({
  supabase,
  userId,
  marketplace,
}: {
  supabase: ReturnType<typeof supabaseAdmin>;
  userId: string;
  marketplace: string;
}): Promise<UserBlockRow[]> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("marketplace, type, value")
    .eq("user_id", userId)
    .eq("marketplace", marketplace)
    .limit(200);

  if (error) {
    console.warn("Failed to load user blocks", error);
    return [];
  }

  return (Array.isArray(data) ? data : []) as any;
}

function extractSellerStrings(deal: any): string[] {
  const data = deal?.data && typeof deal.data === "object" ? deal.data : {};
  const candidates = [
    data?.sellerName,
    data?.seller?.name,
    data?.seller?.id,
    data?.sellerId,
    data?.seller_id,
    data?.profileName,
    data?.profile_name,
  ];
  return candidates
    .map((v) => safeLower(v))
    .filter((v) => v.length > 0)
    .slice(0, 6);
}

function extractDescriptionText(deal: any): string {
  const data = deal?.data && typeof deal.data === "object" ? deal.data : {};
  return safeLower(
    data?.description ??
      data?.desc ??
      data?.text ??
      data?.details ??
      ""
  );
}

function applyUserBlocks(deals: DealRow[], blocks: UserBlockRow[]): DealRow[] {
  if (!blocks || blocks.length === 0) return deals;

  const keywordBlocks = blocks
    .filter((b) => b.type === "keyword")
    .map((b) => safeLower(b.value))
    .filter(Boolean);
  const locationBlocks = blocks
    .filter((b) => b.type === "location")
    .map((b) => safeLower(b.value))
    .filter(Boolean);
  const sellerBlocks = blocks
    .filter((b) => b.type === "seller")
    .map((b) => safeLower(b.value))
    .filter(Boolean);

  if (keywordBlocks.length === 0 && locationBlocks.length === 0 && sellerBlocks.length === 0) {
    return deals;
  }

  return deals.filter((deal: any) => {
    const title = safeLower(deal?.title);
    const location = safeLower(deal?.location);
    const description = extractDescriptionText(deal);
    const sellerStrings = extractSellerStrings(deal);

    if (keywordBlocks.some((k) => k && (title.includes(k) || description.includes(k)))) {
      return false;
    }
    if (locationBlocks.some((l) => l && location.includes(l))) {
      return false;
    }
    if (sellerBlocks.some((s) => s && sellerStrings.some((cand) => cand.includes(s)))) {
      return false;
    }

    return true;
  });
}

async function loadDealsForMarketplace({
  region,
  marketplace,
  limit,
  scanLimit,
  minPrice,
  maxPrice,
  blocks,
}: {
  region: AppRegion;
  marketplace: string;
  limit: number;
  scanLimit: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  blocks?: UserBlockRow[];
}): Promise<DealRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const selectWithFetched =
    "id, search_id, region, marketplace, title, price, currency, score, location, url, images, primary_image, thumbnail, attributes, data, created_at, fetched_at, posted_at";
  const selectLegacy =
    "id, search_id, marketplace, title, price, currency, score, location, url, data, created_at";

  let query = supabase
    .from("deals")
    .select(selectWithFetched)
    .eq("region", region)
    .eq("marketplace", marketplace)
    // Pooled market state only (UI must never depend on per-search deals rows).
    .is("search_id", null);

  if (typeof minPrice === "number" && Number.isFinite(minPrice)) {
    query = query.gte("price", minPrice);
  }
  if (typeof maxPrice === "number" && Number.isFinite(maxPrice)) {
    query = query.lte("price", maxPrice);
  }

  if (Array.isArray(blocks) && blocks.length > 0) {
    for (const b of blocks) {
      const type = typeof b?.type === "string" ? b.type : "";
      const raw = typeof b?.value === "string" ? b.value.trim() : "";
      if (!raw) continue;
      const value = escapeLikePattern(raw);
      if (!value) continue;

      if (type === "keyword") {
        query = query.not("title", "ilike", `%${value}%`);
      } else if (type === "location") {
        query = query.not("location", "ilike", `%${value}%`);
      }
    }
  }

  let { data, error } = await query
    .order("fetched_at", { ascending: false })
    .limit(scanLimit);

  if (error && isUnknownColumnOrTable(error)) {
    let fallbackQuery = supabase
      .from("deals")
      .select(selectLegacy)
      .eq("marketplace", marketplace)
      .is("search_id", null);

    if (typeof minPrice === "number" && Number.isFinite(minPrice)) {
      fallbackQuery = fallbackQuery.gte("price", minPrice);
    }
    if (typeof maxPrice === "number" && Number.isFinite(maxPrice)) {
      fallbackQuery = fallbackQuery.lte("price", maxPrice);
    }

    if (Array.isArray(blocks) && blocks.length > 0) {
      for (const b of blocks) {
        const type = typeof b?.type === "string" ? b.type : "";
        const raw = typeof b?.value === "string" ? b.value.trim() : "";
        if (!raw) continue;
        const value = escapeLikePattern(raw);
        if (!value) continue;

        if (type === "keyword") {
          fallbackQuery = fallbackQuery.not("title", "ilike", `%${value}%`);
        } else if (type === "location") {
          fallbackQuery = fallbackQuery.not("location", "ilike", `%${value}%`);
        }
      }
    }

    const fallback = await fallbackQuery
      .order("created_at", { ascending: false })
      .limit(scanLimit);

    data =
      fallback.data?.map((row: any) => ({
        ...row,
        region: null,
        images: null,
        primary_image: null,
        thumbnail: null,
        attributes: null,
        fetched_at: null,
        posted_at: null,
      })) ?? null;
    error = fallback.error;
  }

  if (error) {
    console.error("Failed to load pooled deals", error);
    return [];
  }

  const rows = (Array.isArray(data) ? data : []) as DealRow[];
  const filtered = Array.isArray(blocks) && blocks.length > 0 ? applyUserBlocks(rows, blocks) : rows;
  return filtered.slice(0, limit);
}

const QuerySchema = z.object({
  region: z.string().optional(),
  marketplace: z.string().min(1).optional(),
  marketplaces: z.string().optional(),
  searchId: z.string().uuid().optional(),
  searchIds: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : DEFAULT_LIMIT))
    .transform((v) =>
      Number.isFinite(v) ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(v))) : DEFAULT_LIMIT
    ),
});

export async function GET(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    region: searchParams.get("region") ?? undefined,
    marketplace: searchParams.get("marketplace") ?? undefined,
    marketplaces: searchParams.get("marketplaces") ?? undefined,
    searchId: searchParams.get("searchId") ?? undefined,
    searchIds: searchParams.get("searchIds") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { marketplace: marketplaceRaw, marketplaces: marketplacesRaw, searchId, searchIds, minPrice, maxPrice, limit } =
    parsed.data;

  if (!marketplaceRaw && !marketplacesRaw && !searchId && !searchIds) {
    return NextResponse.json(
      { error: "Missing marketplace, marketplaces, or searchId" },
      { status: 400 }
    );
  }

  const marketplaceParam = normalizeMarketplace(marketplaceRaw) ?? null;
  const marketplacesParam = typeof marketplacesRaw === "string" ? marketplacesRaw : null;
  const minPriceNum = typeof minPrice === "string" ? Number(minPrice) : null;
  const maxPriceNum = typeof maxPrice === "string" ? Number(maxPrice) : null;

  const user = await getUser();
  const userId = user?.id ?? null;
  const region = inferAppRegionFromRequest(req, { user });

  const parseMarketplaces = (raw: string | null): string[] => {
    if (!raw) return [];
    return Array.from(
      new Set(
        raw
          .split(",")
          .map((v) => normalizeMarketplace(v))
          .filter((v): v is string => typeof v === "string" && v.length > 0)
      )
    ).slice(0, 8);
  };

  const marketplacesList = parseMarketplaces(marketplacesParam);

  // If a searchId is provided, filter pooled deals by that saved_search params (read-only).
  if (searchId) {
    const { data: search, error: searchError } = await supabase
      .from("saved_searches")
      .select("id, user_id, region, marketplace, params, status")
      .eq("id", searchId)
      .maybeSingle();

    if (searchError) {
      console.error("Failed to load saved search for deal filtering", searchError);
      return NextResponse.json(
        { error: "Failed to load saved search" },
        { status: 500 }
      );
    }

    if (!search) {
      return NextResponse.json({ deals: [] as DealRow[] });
    }

    const searchRegion =
      typeof (search as any)?.region === "string" && (search as any).region.trim().length > 0
        ? (((search as any).region as string).trim().toUpperCase() as AppRegion)
        : region;

    const ownerId = typeof (search as any).user_id === "string" ? (search as any).user_id : null;
    // Guardrail: saved searches are user intent and must never be readable/usable cross-user.
    // If a saved_search has an owner, require an authenticated match.
    if (ownerId) {
      if (!userId) {
        return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
      }
      if (ownerId !== userId) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
    } else {
      // Demo/seed searches (user_id IS NULL) are never exposed implicitly in production.
      // If you want to support public demo searches, do it explicitly behind DEMO_PUBLIC=true.
      if (process.env.DEMO_PUBLIC !== "true") {
        return NextResponse.json({ deals: [] as DealRow[] });
      }
    }

    const searchParamsJson = (search as any)?.params ?? {};
    const marketplacesFromParams: string[] = Array.isArray(searchParamsJson?.marketplaces)
      ? (searchParamsJson.marketplaces as any[])
          .map((m) => normalizeMarketplace(m))
          .filter((m): m is string => typeof m === "string" && m.length > 0)
      : [];

    const marketplacesToScan: string[] =
      marketplacesFromParams.length > 0
        ? Array.from(new Set<string>(marketplacesFromParams)).slice(0, 8)
        : [normalizeMarketplace((search as any).marketplace) ?? marketplaceParam ?? "facebook"];

    const scans: DealRow[] = [];
    for (const marketplace of marketplacesToScan) {
      const blocks = userId
        ? await loadUserBlocksForMarketplace({ supabase, userId, marketplace })
        : [];
      const scan = await loadDealsForMarketplace({
        region: searchRegion,
        marketplace,
        limit: MAX_DEALS_SCAN,
        scanLimit: MAX_DEALS_SCAN,
        minPrice: Number.isFinite(minPriceNum) ? minPriceNum : null,
        maxPrice: Number.isFinite(maxPriceNum) ? maxPriceNum : null,
        blocks,
      });
      scans.push(...scan);
    }

    const matched = scans.filter((deal) =>
      dealMatchesSavedSearch(deal as any, search as any)
    );

    const ranked = rankDealsForDisplay(matched as any) as DealRow[];
    return NextResponse.json({ deals: ranked.slice(0, limit) });
  }

  // If searchIds are provided, union deals matching any selected search (read-only).
  if (searchIds) {
    const ids = Array.from(
      new Set(
        searchIds
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      )
    ).slice(0, 10);

    if (ids.length === 0) {
      return NextResponse.json({ deals: [] as DealRow[] });
    }

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const { data: searches, error: searchesError } = await supabase
      .from("saved_searches")
      .select("id, user_id, region, marketplace, params, status")
      .in("id", ids);

    if (searchesError) {
      console.error("Failed to load saved searches for filtering", searchesError);
      return NextResponse.json(
        { error: "Failed to load saved searches" },
        { status: 500 }
      );
    }

    const allowedSearches = (Array.isArray(searches) ? searches : []).filter((row: any) => {
      const ownerId = typeof row?.user_id === "string" ? row.user_id : null;
      return ownerId === userId;
    }) as SavedSearchRow[];

    if (allowedSearches.length === 0) {
      return NextResponse.json({ deals: [] as DealRow[] });
    }

    const marketplacesToScan =
      marketplacesList.length > 0
        ? marketplacesList
        : Array.from(
            new Set(
              allowedSearches
                .map((s: any) => normalizeMarketplace(s?.marketplace))
                .filter((m): m is string => typeof m === "string" && m.length > 0)
            )
          ).slice(0, 8);

    const scans: DealRow[] = [];
    for (const marketplace of marketplacesToScan) {
      const blocks = await loadUserBlocksForMarketplace({ supabase, userId, marketplace });
      const scan = await loadDealsForMarketplace({
        region,
        marketplace,
        limit: MAX_DEALS_SCAN,
        scanLimit: MAX_DEALS_SCAN,
        minPrice: Number.isFinite(minPriceNum) ? minPriceNum : null,
        maxPrice: Number.isFinite(maxPriceNum) ? maxPriceNum : null,
        blocks,
      });
      scans.push(...scan);
    }

    const matched = scans.filter((deal) =>
      allowedSearches.some((search) => dealMatchesSavedSearch(deal as any, search as any))
    );

    const ranked = rankDealsForDisplay(matched as any) as DealRow[];
    return NextResponse.json({ deals: ranked.slice(0, limit) });
  }

  // Multi-marketplace pooled feed.
  if (marketplacesList.length > 0) {
    const scans: DealRow[] = [];

    for (const marketplace of marketplacesList) {
      const blocks = userId ? await loadUserBlocksForMarketplace({ supabase, userId, marketplace }) : [];
      const scan = await loadDealsForMarketplace({
        region,
        marketplace,
        limit: MAX_DEALS_SCAN,
        scanLimit: MAX_DEALS_SCAN,
        minPrice: Number.isFinite(minPriceNum) ? minPriceNum : null,
        maxPrice: Number.isFinite(maxPriceNum) ? maxPriceNum : null,
        blocks,
      });
      scans.push(...scan);
    }

    const ranked = rankDealsForDisplay(scans as any) as DealRow[];
    return NextResponse.json({ deals: ranked.slice(0, limit) });
  }

  const marketplace = marketplaceParam ?? "facebook";
  const blocks = userId ? await loadUserBlocksForMarketplace({ supabase, userId, marketplace }) : [];
  const deals = await loadDealsForMarketplace({
    region,
    marketplace,
    limit,
    scanLimit: limit,
    minPrice: Number.isFinite(minPriceNum) ? minPriceNum : null,
    maxPrice: Number.isFinite(maxPriceNum) ? maxPriceNum : null,
    blocks,
  });

  // Demo fallback: return demo seeded rows when no deals exist.
  if (deals.length === 0 && process.env.DEMO_SEED === "true") {
    const { data: demoRows, error: demoError } = await supabase
      .from("deals")
      .select(
        "id, search_id, region, marketplace, title, price, currency, score, location, url, images, primary_image, thumbnail, attributes, data, created_at, fetched_at, posted_at"
      )
      .eq("region", region)
      .eq("marketplace", marketplace)
      .is("search_id", null)
      .contains("data", { demo: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!demoError && Array.isArray(demoRows) && demoRows.length > 0) {
      return NextResponse.json({ deals: demoRows as DealRow[] });
    }
  }

  return NextResponse.json({ deals });
}
