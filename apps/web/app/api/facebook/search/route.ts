import { NextResponse } from "next/server";
import { calculateMarketplaceFees } from "@magnus-flipper-ai/profit-engine/ledger/feeModel";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

type PoolRow = {
  id: string;
  market: string;
  city: string;
  category: string;
  query_template: string | null;
  enabled: boolean;
  status: string;
};

type ListingRow = {
  id: string;
  pool_id: string;
  source_listing_id: string;
  title: string | null;
  price: number | string | null;
  currency: string | null;
  location_text: string | null;
  url: string | null;
  posted_at: string | null;
  last_seen_at: string;
};

function toNumber(value: unknown): number | null {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : null;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function normalizeQueryParam(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const market = normalizeQueryParam(searchParams.get("market")) ?? "UK";
  const city = normalizeQueryParam(searchParams.get("city"));
  const category = normalizeQueryParam(searchParams.get("category"));
  const keyword = normalizeQueryParam(searchParams.get("keyword"));

  const freshnessSeconds = clampInt(
    toNumber(searchParams.get("freshnessSeconds")) ?? 24 * 60 * 60,
    60,
    24 * 60 * 60
  );

  if (!city && !category && !keyword) {
    return NextResponse.json(
      { error: "MISSING_QUERY", hint: "Provide city, category, or keyword" },
      { status: 400 }
    );
  }

  let supabase: ReturnType<typeof supabaseAdmin>;
  try {
    supabase = supabaseAdmin();
  } catch {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }

  const region =
    market.trim().toUpperCase() === "UK" || market.trim().toUpperCase() === "GB" ? "UK" : "US";

  let poolsQuery = supabase
    .from("deal_pools")
    .select("id, region, enabled, status, pool_key, params")
    .eq("marketplace", "facebook")
    .eq("enabled", true)
    .neq("status", "paused")
    .eq("region", region);

  if (city) poolsQuery = poolsQuery.ilike("params->>city", `%${city}%`);
  if (category) poolsQuery = poolsQuery.ilike("params->>category", `%${category}%`);

  const { data: pools, error: poolsError } = await poolsQuery.limit(25);

  if (poolsError) {
    console.error("[fb-search] deal_pools lookup failed", poolsError);
    return NextResponse.json({ error: "POOL_LOOKUP_FAILED" }, { status: 500 });
  }

  const rawPools = Array.isArray(pools) ? pools : [];
  const poolRows = rawPools
    .map((row: any) => {
      const params = row?.params && typeof row.params === "object" ? row.params : {};
      const marketValue =
        typeof params?.market === "string" && params.market.trim().length > 0
          ? params.market.trim()
          : String(row?.region ?? "US");
      const cityValue =
        typeof params?.city === "string" && params.city.trim().length > 0 ? params.city.trim() : "";
      const categoryValue =
        typeof params?.category === "string" && params.category.trim().length > 0
          ? params.category.trim()
          : "";
      const queryTemplate =
        typeof params?.query_template === "string" && params.query_template.trim().length > 0
          ? params.query_template.trim()
          : null;

      return {
        id: String(row?.id),
        market: marketValue,
        city: cityValue,
        category: categoryValue,
        query_template: queryTemplate,
        enabled: Boolean(row?.enabled),
        status: String(row?.status ?? ""),
      } satisfies PoolRow;
    })
    .filter((row: PoolRow) => Boolean(row.id));

  const keywordLower = keyword ? keyword.toLowerCase() : null;
  const filteredPools =
    keywordLower && keywordLower.length > 0
      ? poolRows.filter((p) => {
          const q = typeof p.query_template === "string" ? p.query_template.toLowerCase() : "";
          return q.length === 0 || q.includes(keywordLower);
        })
      : poolRows;

  const poolIds = filteredPools.map((p) => p.id);

  if (poolIds.length === 0) {
    console.info("[fb-search] cache_miss", { market, city, category, keyword, poolCount: 0 });
    return NextResponse.json({ pools: [], listings: [], cache: "miss" });
  }

  const cutoffIso = new Date(Date.now() - freshnessSeconds * 1000).toISOString();

  let listingsQuery = supabase
    .from("fb_listings")
    .select(
      "id,pool_id,source_listing_id,title,price,currency,location_text,url,posted_at,last_seen_at"
    )
    .in("pool_id", poolIds)
    .eq("is_active", true)
    .gte("last_seen_at", cutoffIso)
    .order("last_seen_at", { ascending: false })
    .limit(200);

  if (keyword) listingsQuery = listingsQuery.ilike("title", `%${keyword}%`);

  const { data: listings, error: listingsError } = await listingsQuery;

  if (listingsError) {
    console.error("[fb-search] fb_listings lookup failed", listingsError);
    return NextResponse.json({ error: "LISTINGS_LOOKUP_FAILED" }, { status: 500 });
  }

  const listingRows = (listings ?? []) as ListingRow[];
  const prices = listingRows
    .map((row) => toNumber(row.price))
    .filter((p): p is number => typeof p === "number" && p > 0);

  const marketPrice = median(prices);

  const scored = listingRows.map((row) => {
    const buyPrice = toNumber(row.price);
    const salePrice = marketPrice;

    let feesTotal: number | null = null;
    let netProceeds: number | null = null;
    let profit: number | null = null;
    let roiPct: number | null = null;

    if (buyPrice && buyPrice > 0 && salePrice && salePrice > 0) {
      const fees = calculateMarketplaceFees("facebook", salePrice, category ?? undefined);
      feesTotal = fees.totalFees;
      netProceeds = salePrice - fees.totalFees;
      profit = netProceeds - buyPrice;
      roiPct = buyPrice > 0 ? (profit / buyPrice) * 100 : null;
    }

    return {
      ...row,
      buy_price: buyPrice,
      market_price: salePrice,
      fees_total: feesTotal,
      net_proceeds: netProceeds,
      profit,
      roi_pct: roiPct,
      score: roiPct,
    };
  });

  scored.sort((a, b) => {
    const aRoi = typeof a.roi_pct === "number" ? a.roi_pct : -Infinity;
    const bRoi = typeof b.roi_pct === "number" ? b.roi_pct : -Infinity;
    const roiDelta = bRoi - aRoi;
    if (roiDelta !== 0) return roiDelta;

    const aProfit = typeof a.profit === "number" ? a.profit : -Infinity;
    const bProfit = typeof b.profit === "number" ? b.profit : -Infinity;
    const profitDelta = bProfit - aProfit;
    if (profitDelta !== 0) return profitDelta;

    const aSeen = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
    const bSeen = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
    const seenDelta = bSeen - aSeen;
    if (seenDelta !== 0) return seenDelta;

    return String(a.id).localeCompare(String(b.id));
  });

  console.info("[fb-search] cache_result", {
    market,
    city,
    category,
    keyword,
    poolCount: poolIds.length,
    listingCount: scored.length,
    hit: scored.length > 0,
  });

  return NextResponse.json({
    pools: filteredPools,
    listings: scored,
    cache: scored.length > 0 ? "hit" : "miss",
    market_price: marketPrice,
    freshness_seconds: freshnessSeconds,
  });
}
