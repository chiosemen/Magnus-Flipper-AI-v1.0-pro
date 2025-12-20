type Json = Record<string, any> | null | undefined;

export type SavedSearchLike = {
  marketplace?: string | null;
  params?: Json;
};

export type DealLike = {
  marketplace?: string | null;
  title?: string | null;
  price?: number | string | null;
  location?: string | null;
  score?: number | string | null;
  primary_image?: string | null;
  created_at?: string | null;
  fetched_at?: string | null;
  posted_at?: string | null;
  attributes?: Json;
};

function safeLower(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function toMillis(value: unknown): number {
  if (typeof value !== "string" || value.length === 0) return 0;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export function normalizeMarketplace(value: unknown): string {
  const lower = safeLower(value);
  return lower.length > 0 ? lower : "facebook";
}

function keywordsFromParams(params: Json): string[] {
  const keywordsRaw = (params as any)?.keywords;
  if (Array.isArray(keywordsRaw)) {
    return keywordsRaw.map((k) => safeLower(k)).filter(Boolean);
  }

  const query = safeLower((params as any)?.query);
  if (query.length > 0) {
    return query
      .split(/[,\s]+/g)
      .map((k) => safeLower(k))
      .filter(Boolean)
      .slice(0, 12);
  }

  return [];
}

function marketplacesFromParams(params: Json): string[] {
  const raw = (params as any)?.marketplaces ?? (params as any)?.marketplace;
  if (Array.isArray(raw)) {
    const list = raw.map((m) => normalizeMarketplace(m)).filter(Boolean);
    return Array.from(new Set(list)).slice(0, 8);
  }

  const asString = safeLower(raw);
  if (asString.length > 0) {
    const parts = asString
      .split(/[,\s]+/g)
      .map((m) => normalizeMarketplace(m))
      .filter(Boolean)
      .slice(0, 8);
    return Array.from(new Set(parts));
  }

  return [];
}

function excludeKeywordsFromParams(params: Json): string[] {
  const raw = (params as any)?.excludeKeywords ?? (params as any)?.exclude_keywords;
  if (Array.isArray(raw)) {
    return raw.map((k) => safeLower(k)).filter(Boolean).slice(0, 24);
  }
  const asString = safeLower(raw);
  if (asString.length > 0) {
    return asString
      .split(/[,\s]+/g)
      .map((k) => safeLower(k))
      .filter(Boolean)
      .slice(0, 24);
  }
  return [];
}

function matchesAnyKeyword(title: string, keywords: string[]): boolean {
  if (!title || keywords.length === 0) return true;
  return keywords.some((keyword) => keyword.length > 0 && title.includes(keyword));
}

function containsAny(haystack: string, needles: string[]): boolean {
  if (!haystack || needles.length === 0) return false;
  return needles.some((needle) => needle.length > 0 && haystack.includes(needle));
}

function matchesLocation(haystack: string, location: unknown): boolean {
  const loc = safeLower(location);
  if (!loc) return true;
  return haystack.includes(loc);
}

function matchesCarParams({
  deal,
  params,
}: {
  deal: DealLike;
  params: Json;
}): boolean {
  const attributes = (deal as any)?.attributes ?? {};
  const make = safeLower((params as any)?.make);
  const model = safeLower((params as any)?.model);
  const title = safeLower(deal.title);

  const attrMake = safeLower((attributes as any)?.make);
  const attrModel = safeLower((attributes as any)?.model);

  if (make && !(attrMake.includes(make) || title.includes(make))) return false;
  if (model && !(attrModel.includes(model) || title.includes(model))) return false;

  const minYear = parseNumber((params as any)?.minYear);
  const maxYear = parseNumber((params as any)?.maxYear);
  const year = parseNumber((attributes as any)?.year);
  if (year !== null) {
    if (minYear !== null && year < minYear) return false;
    if (maxYear !== null && year > maxYear) return false;
  }

  const maxMileage = parseNumber((params as any)?.maxMileage);
  const mileage = parseNumber((attributes as any)?.mileage);
  if (maxMileage !== null && mileage !== null && mileage > maxMileage) return false;

  const maxPrice = parseNumber((params as any)?.maxPrice);
  const price = parseNumber(deal.price);
  if (maxPrice !== null && price !== null && price > maxPrice) return false;

  const location = (params as any)?.location;
  const dealLocation = safeLower(deal.location);
  if (!matchesLocation(dealLocation, location)) return false;

  return true;
}

function matchesFacebookParams({
  deal,
  params,
}: {
  deal: DealLike;
  params: Json;
}): boolean {
  const keywords = keywordsFromParams(params);
  const title = safeLower(deal.title);
  if (!matchesAnyKeyword(title, keywords)) return false;

  const minPrice = parseNumber((params as any)?.minPrice ?? (params as any)?.min_price);
  const maxPrice = parseNumber((params as any)?.maxPrice ?? (params as any)?.max_price);
  const price = parseNumber(deal.price);
  if (minPrice !== null && price !== null && price < minPrice) return false;
  if (maxPrice !== null && price !== null && price > maxPrice) return false;

  const location = (params as any)?.location;
  const dealLocation = safeLower(deal.location);
  if (!matchesLocation(dealLocation, location)) return false;

  return true;
}

export function dealMatchesSavedSearch(deal: DealLike, search: SavedSearchLike): boolean {
  const params = search.params ?? {};

  const dealMarketplace = normalizeMarketplace(deal.marketplace);
  const overrideMarketplaces = marketplacesFromParams(params);
  const searchMarketplace = normalizeMarketplace(search.marketplace);

  // Multi-marketplace searches can specify `params.marketplaces` (array or comma-separated).
  if (overrideMarketplaces.length > 0) {
    if (!overrideMarketplaces.includes(dealMarketplace)) return false;
  } else if (searchMarketplace && dealMarketplace && searchMarketplace !== dealMarketplace) {
    return false;
  }

  // Anti-keywords (spam reduction). Template installs can set `excludeKeywords` in params.
  const title = safeLower(deal.title);
  const exclude = excludeKeywordsFromParams(params);
  if (exclude.length > 0 && containsAny(title, exclude)) return false;

  const marketplaceToMatch = overrideMarketplaces.length > 0 ? dealMarketplace : searchMarketplace;

  if (marketplaceToMatch === "cars") {
    return matchesCarParams({ deal, params });
  }

  return matchesFacebookParams({ deal, params });
}

export function rankDealsForDisplay<T extends DealLike>(deals: T[]): T[] {
  return [...deals].sort((a, b) => {
    const aScore = parseNumber((a as any).score) ?? 0;
    const bScore = parseNumber((b as any).score) ?? 0;
    if (bScore !== aScore) return bScore - aScore;

    const aTs = Math.max(toMillis((a as any).fetched_at), toMillis((a as any).created_at));
    const bTs = Math.max(toMillis((b as any).fetched_at), toMillis((b as any).created_at));
    if (bTs !== aTs) return bTs - aTs;

    return String((a as any).listing_id ?? (a as any).id ?? "").localeCompare(
      String((b as any).listing_id ?? (b as any).id ?? "")
    );
  });
}

export function newestDealTimestamp(deals: DealLike[]): string | null {
  const newest = deals
    .map((deal) => {
      const ts = Math.max(toMillis((deal as any).fetched_at), toMillis((deal as any).created_at));
      return ts > 0 ? { ts, value: (deal as any).fetched_at ?? (deal as any).created_at } : null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.ts - a.ts)[0];

  return typeof newest?.value === "string" ? newest.value : null;
}
