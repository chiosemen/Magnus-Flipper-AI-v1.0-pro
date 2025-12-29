import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';
import { runMarketplaceActor } from '../lib/apifyActors';
import { planPooledRuns, type PoolRequest } from '../lib/geopool';
import { MARKETPLACES, type MarketplaceId } from '../lib/marketplaceRegistry';

const DEFAULT_FACEBOOK_QUERY = 'iphone';
const DEFAULT_VINTED_QUERY = 'nike';
const DEFAULT_LOCATION = 'prague';
const DEFAULT_LIMIT = 20;
const DEFAULT_RADIUS_KM = 50;
const DEFAULT_RUN_TIMEOUT_MS = 120000;

type Tier = 'free' | 'pro' | 'agency' | 'enterprise';

type TierPolicy = {
  tier: Tier;
  maxQueriesPerRun: number;
  maxMarketsPerRun: number;
  maxConcurrency: number;
  marketsAllowed: MarketplaceId[];
  dailyRunLimit?: number;
};

function getTierAllowedMarkets(tier: Tier): MarketplaceId[] {
  return Object.values(MARKETPLACES)
    .filter((market) => market.enabled && market.tierAccess[tier])
    .map((market) => market.id);
}

const TIER_POLICIES: Record<Tier, TierPolicy> = {
  free: {
    tier: 'free',
    maxQueriesPerRun: 2,
    maxMarketsPerRun: 2,
    maxConcurrency: 1,
    marketsAllowed: getTierAllowedMarkets('free'),
    dailyRunLimit: 5,
  },
  pro: {
    tier: 'pro',
    maxQueriesPerRun: 5,
    maxMarketsPerRun: 4,
    maxConcurrency: 3,
    marketsAllowed: getTierAllowedMarkets('pro'),
    dailyRunLimit: 50,
  },
  agency: {
    tier: 'agency',
    maxQueriesPerRun: 10,
    maxMarketsPerRun: 10,
    maxConcurrency: 10,
    marketsAllowed: getTierAllowedMarkets('agency'),
  },
  enterprise: {
    tier: 'enterprise',
    maxQueriesPerRun: 10,
    maxMarketsPerRun: 10,
    maxConcurrency: 10,
    marketsAllowed: getTierAllowedMarkets('enterprise'),
  },
};

async function getUserTier(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<Tier> {
  try {
    const { data, error } = await supabase
      .from('user_tiers')
      .select('tier')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data?.tier) {
      return 'free';
    }
    const normalized = String(data.tier).toLowerCase();
    return normalized in TIER_POLICIES ? (normalized as Tier) : 'free';
  } catch {
    return 'free';
  }
}

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getQueryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseFloatValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeList(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item));
  }
  if (typeof input === 'string') {
    return input.split(',');
  }
  return [];
}

function parseQueries(input: unknown): string[] {
  const raw = normalizeList(input);
  const trimmed = raw.map((q) => q.trim()).filter(Boolean);
  return Array.from(new Set(trimmed));
}

function parseMarkets(input: unknown): string[] {
  const raw = normalizeList(input);
  return raw.map((m) => m.trim().toLowerCase()).filter(Boolean);
}

function isMarketplaceId(value: string): value is MarketplaceId {
  return value in MARKETPLACES;
}

function parseBody(req: VercelRequest): Record<string, any> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') {
    return req.body as Record<string, any>;
  }
  return {};
}

async function resolvePostalCode(
  req: VercelRequest,
  postalCode: string,
  country?: string,
) {
  const host = req.headers?.host;
  if (!host) return null;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const baseUrl = `${proto}://${host}`;
  const response = await fetch(`${baseUrl}/api/geo/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postalCode, country }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.error || 'Postal resolution failed';
    throw new Error(message);
  }
  return response.json() as Promise<{
    postalCode: string;
    country: string;
    lat: number;
    lng: number;
    source: 'provider' | 'cache';
  }>;
}

type GeoPoint = {
  lat: number;
  lng: number;
  text?: string;
  country?: string;
};

const GEO_FALLBACKS: Record<string, GeoPoint> = {
  london: { lat: 51.5074, lng: -0.1278, country: 'uk' },
  manchester: { lat: 53.4808, lng: -2.2426, country: 'uk' },
  birmingham: { lat: 52.4862, lng: -1.8904, country: 'uk' },
  prague: { lat: 50.0755, lng: 14.4378, country: 'cz' },
};

function normalizeRadiusKm(value: unknown, units: unknown): number | null {
  const parsed = parseFloatValue(value);
  if (parsed === null || parsed <= 0) return null;
  const unit = typeof units === 'string' ? units.toLowerCase() : 'km';
  return unit === 'mi' ? parsed * 1.60934 : parsed;
}

function resolveGeoLocation(
  locationText: string | null,
  lat: number | null,
  lng: number | null,
): GeoPoint | null {
  if (lat !== null && lng !== null) {
    return { lat, lng, text: locationText ?? undefined };
  }
  if (!locationText) return null;
  const key = locationText.trim().toLowerCase();
  const fallback = GEO_FALLBACKS[key];
  if (!fallback) return null;
  return { ...fallback, text: locationText };
}

async function requireUserFromJWT(authHeader?: string) {
  if (!authHeader) {
    return { userId: null, tier: 'free' as Tier };
  }

  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  if (!token) {
    return { userId: null, tier: 'free' as Tier };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { userId: null, tier: 'free' as Tier };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return { userId: null, tier: 'free' as Tier };
    }

    const tier = await getUserTier(supabase, data.user.id);
    return { userId: data.user.id, tier };
  } catch {
    return { userId: null, tier: 'free' as Tier };
  }
}

function buildRunOptions(tier: Tier, limit: number) {
  const baseTimeout = parseNumber(
    process.env.APIFY_RUN_TIMEOUT_MS,
    DEFAULT_RUN_TIMEOUT_MS,
  );

  if (tier === 'enterprise') {
    return {
      maxRetries: 3,
      timeoutMs: Math.max(baseTimeout, 180000),
    };
  }

  if (tier === 'agency') {
    return {
      maxRetries: 2,
      timeoutMs: baseTimeout,
      adjustOnRetry: ({
        input,
        itemsLimit,
      }: {
        attempt: number;
        error: { classified: string; message: string };
        input: Record<string, any>;
        itemsLimit: number;
      }) => {
        const nextLimit = Math.max(5, Math.floor(itemsLimit / 2));
        const nextInput = { ...input };
        if (typeof nextInput.resultsLimit === 'number') {
          nextInput.resultsLimit = Math.min(nextInput.resultsLimit, nextLimit);
        }
        return { input: nextInput, itemsLimit: nextLimit };
      },
    };
  }

  if (tier === 'pro') {
    return {
      maxRetries: 2,
      timeoutMs: baseTimeout,
    };
  }

  return {
    maxRetries: 0,
    timeoutMs: baseTimeout,
  };
}

async function runPool<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      results[current] = await tasks[current]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'APIFY_TOKEN missing' });
    return;
  }

  const user = await requireUserFromJWT(req.headers.authorization);
  const policy = TIER_POLICIES[user.tier];
  const body = parseBody(req);

  let queries = parseQueries(body.q ?? body.queries);
  const requestedQueries = queries.length;
  queries = queries.slice(0, policy.maxQueriesPerRun);

  let markets = parseMarkets(body.markets);
  if (markets.length === 0) {
    markets = policy.marketsAllowed.slice();
  } else {
    const unsupported = markets.filter((market) => {
      if (!isMarketplaceId(market)) return true;
      return !MARKETPLACES[market].enabled;
    });
    if (unsupported.length > 0) {
      res.status(400).json({
        error: `Unsupported marketplaces: ${unsupported.join(', ')}`,
      });
      return;
    }
  }
  const filteredMarkets = markets.filter(
    (market): market is MarketplaceId =>
      isMarketplaceId(market) && policy.marketsAllowed.includes(market),
  );
  const typedMarkets = filteredMarkets.slice(0, policy.maxMarketsPerRun);

  if (queries.length === 0) {
    res.status(400).json({ error: 'No queries provided' });
    return;
  }

  if (typedMarkets.length === 0) {
    res.status(400).json({ error: 'No allowed marketplaces for this tier' });
    return;
  }

  const limit = Math.max(1, parseNumber(body.limit, DEFAULT_LIMIT));
  const postalCode = normalizeString(body.postalCode);
  const locationTextInput =
    normalizeString(body.locationText) ?? normalizeString(body.location);
  let lat = parseFloatValue(body.lat ?? body.latitude);
  let lng = parseFloatValue(body.lng ?? body.longitude);
  let resolvedPostal: { postalCode: string; country: string; lat: number; lng: number } | null =
    null;
  if (lat === null && lng === null && postalCode) {
    try {
      resolvedPostal = await resolvePostalCode(
        req,
        postalCode,
        normalizeString(body.country) ?? undefined,
      );
      lat = resolvedPostal.lat;
      lng = resolvedPostal.lng;
    } catch (error: any) {
      res.status(400).json({ error: error?.message || 'Postal resolution failed' });
      return;
    }
  }
  const locationText =
    locationTextInput ??
    (postalCode ?? null) ??
    (lat !== null && lng !== null ? null : DEFAULT_LOCATION);
  const radiusKm =
    normalizeRadiusKm(body.radiusKm, body.units) ?? DEFAULT_RADIUS_KM;
  const resolvedLocation = resolveGeoLocation(locationText, lat, lng);
  const locationUsed = resolvedLocation
    ? {
        text: resolvedLocation.text ?? null,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
        country: resolvedLocation.country ?? null,
      }
    : locationText
    ? { text: locationText }
    : null;
  const client = new ApifyClient({ token });
  const proxy = typeof body.proxy === 'string' ? body.proxy : undefined;
  const region = typeof body.region === 'string' ? body.region : undefined;
  const country = resolvedLocation?.country ?? resolvedPostal?.country ?? null;

  if (typedMarkets.includes('facebook') && !resolvedLocation) {
    res.status(400).json({
      error: 'Location must include lat/lng or a supported locationText for facebook search',
    });
    return;
  }

  const tierRunCaps = Object.fromEntries(
    Object.values(TIER_POLICIES).map((entry) => [entry.tier, entry.maxConcurrency]),
  );

  const requests: PoolRequest[] = [];
  const requestMeta = new Map<
    string,
    {
      market: MarketplaceId;
      query: string;
      locationUsed: typeof locationUsed;
      radiusKmUsed: number | null;
      timestamp: string;
      warnings: string[];
    }
  >();

  for (const query of queries) {
    for (const market of typedMarkets) {
      const requestId = `${market}-${requests.length + 1}`;
      const radiusKmUsed = MARKETPLACES[market].geo.supportsRadius ? radiusKm : null;
      const warnings: string[] = [];
      if (!MARKETPLACES[market].geo.supportsRadius) {
        warnings.push('Radius not supported; using country/city pooling.');
      }

      requests.push({
        requestId,
        userId: user.userId ?? null,
        marketplaceId: market,
        query,
        category: normalizeString(body.category),
        lat: resolvedLocation?.lat ?? null,
        lng: resolvedLocation?.lng ?? null,
        radiusKm: radiusKmUsed,
        tier: policy.tier,
        maxResults: limit,
        country,
        city: locationUsed?.text ?? null,
      });

      requestMeta.set(requestId, {
        market,
        query,
        locationUsed,
        radiusKmUsed,
        timestamp: new Date().toISOString(),
        warnings,
      });
    }
  }

  const { pooledRuns, mapping } = planPooledRuns(requests, tierRunCaps);

  const runOptions = buildRunOptions(policy.tier, limit);
  const tasks = pooledRuns.map((pooledRun) => async () => {
    const pooledKey = `${pooledRun.marketplaceId}:${pooledRun.geoKey}:${pooledRun.queryNormalized}${
      pooledRun.category ? `:${pooledRun.category}` : ''
    }`;
    try {
      const result = await runMarketplaceActor(pooledRun.marketplaceId, pooledRun.query, {
        client,
        locationText: locationText ?? undefined,
        lat: pooledRun.lat ?? undefined,
        lng: pooledRun.lng ?? undefined,
        radiusKm: pooledRun.radiusKm ?? undefined,
        country,
        limit,
        proxy,
        region,
        runOptions,
      });

      console.log(
        JSON.stringify({
          userId: user.userId ?? null,
          tier: user.tier,
          marketplaceId: pooledRun.marketplaceId,
          pooledKey,
          runId: result.runId,
          durationMs: result.durationMs,
          status: result.status,
          errorClass: result.meta.error?.classified ?? null,
        }),
      );

      return { pooledRunId: pooledRun.pooledRunId, result, pooledKey };
    } catch (error: any) {
      console.log(
        JSON.stringify({
          userId: user.userId ?? null,
          tier: user.tier,
          marketplaceId: pooledRun.marketplaceId,
          pooledKey,
          runId: null,
          durationMs: 0,
          status: 'ERROR',
          errorClass: 'UNKNOWN',
        }),
      );
      return { pooledRunId: pooledRun.pooledRunId, error, pooledKey };
    }
  });

  const pooledResults = await runPool(tasks, policy.maxConcurrency);
  const pooledResultMap = new Map<string, (typeof pooledResults)[number]>();
  for (const entry of pooledResults) {
    pooledResultMap.set(entry.pooledRunId, entry);
  }

  const pooledRunMap = new Map(pooledRuns.map((run) => [run.pooledRunId, run]));
  const errors: Array<{
    marketplaceId: MarketplaceId;
    code: string;
    message: string;
    classified: string;
    runId?: string | null;
  }> = [];

  for (const pooledRun of pooledRuns) {
    const pooledResult = pooledResultMap.get(pooledRun.pooledRunId);
    if (!pooledResult || 'error' in pooledResult) {
      errors.push({
        marketplaceId: pooledRun.marketplaceId,
        code: 'UNKNOWN',
        message:
          pooledResult && 'error' in pooledResult
            ? pooledResult.error?.message || 'Search failed'
            : 'Search failed',
        classified: 'UNKNOWN',
      });
      continue;
    }

    const error = pooledResult.result.meta.error;
    if (error) {
      errors.push({
        marketplaceId: pooledRun.marketplaceId,
        code: error.code || error.classified,
        message: error.message,
        classified: error.classified,
        runId: pooledResult.result.runId,
      });
    }
  }

  const results = mapping.map((entry) => {
    const meta = requestMeta.get(entry.requestId);
    const pooledRun = pooledRunMap.get(entry.pooledRunId);
    const pooled = pooledRun ? pooledRun.requestIds.length > 1 : false;
    const pooledResult = pooledResultMap.get(entry.pooledRunId);
    const warnings = [
      ...(meta?.warnings ?? []),
      ...(entry.warnings ?? []),
      ...(pooledRun?.warnings ?? []),
    ];

    if (!meta || !pooledResult || 'error' in pooledResult) {
      return {
        market: meta?.market ?? entry.marketplaceId,
        query: meta?.query ?? 'unknown',
        locationUsed: meta?.locationUsed ?? null,
        radiusKmUsed: meta?.radiusKmUsed ?? null,
        timestamp: meta?.timestamp ?? new Date().toISOString(),
        count: 0,
        items: [],
        durationMs: 0,
        error: pooledResult && 'error' in pooledResult
          ? pooledResult.error?.message || pooledResult.error || 'Search failed'
          : 'Search failed',
        pooling: pooledRun
          ? {
              pooled,
              geoKey: pooledRun.geoKey,
              precision: pooledRun.precision,
              strategy: pooledRun.pooling.strategy,
            }
          : null,
        warnings: warnings.length > 0 ? Array.from(new Set(warnings)) : undefined,
      };
    }

    const result = pooledResult.result;
    const resultError = result.meta.error;
    return {
      ...result,
      locationUsed: meta.locationUsed,
      radiusKmUsed: meta.radiusKmUsed,
      timestamp: meta.timestamp,
      error: resultError?.message,
      pooling: pooledRun
        ? {
            pooled,
            geoKey: pooledRun.geoKey,
            precision: pooledRun.precision,
            strategy: pooledRun.pooling.strategy,
          }
        : null,
      warnings: warnings.length > 0 ? Array.from(new Set(warnings)) : undefined,
    };
  });

  res.status(200).json({
    tier: policy.tier,
    policy: {
      maxQueriesPerRun: policy.maxQueriesPerRun,
      maxMarketsPerRun: policy.maxMarketsPerRun,
      maxConcurrency: policy.maxConcurrency,
      marketsAllowed: policy.marketsAllowed,
      dailyRunLimit: policy.dailyRunLimit,
    },
    requestedQueries,
    executedQueries: queries,
    markets: typedMarkets,
    stats: {
      totalTasks: pooledRuns.length,
      concurrency: policy.maxConcurrency,
    },
    results,
    errors,
    meta: {
      pooledRuns: pooledRuns.length,
      poolingEnabled: pooledRuns.some((run) => run.pooling.enabled),
      errorCount: errors.length,
    },
  });
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'APIFY_TOKEN missing' });
    return;
  }

  const sourceParam = getQueryParam(req.query?.source);
  const source =
    sourceParam && isMarketplaceId(sourceParam) ? sourceParam : null;

  if (
    !source ||
    !MARKETPLACES[source].enabled ||
    (source !== 'facebook' && source !== 'vinted')
  ) {
    res
      .status(400)
      .json({ error: 'Invalid source. Use source=facebook or source=vinted' });
    return;
  }

  const limitParam = getQueryParam(req.query?.limit);
  const limitParsed = Number.parseInt(limitParam ?? '', 10);
  const limit =
    Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : DEFAULT_LIMIT;

  const qParam = getQueryParam(req.query?.q);
  const lat = parseFloatValue(
    getQueryParam(req.query?.lat) ?? getQueryParam(req.query?.latitude),
  );
  const lng = parseFloatValue(
    getQueryParam(req.query?.lng) ?? getQueryParam(req.query?.longitude),
  );
  const locationParam = getQueryParam(req.query?.location);
  const locationTextParam = getQueryParam(req.query?.locationText);
  const locationTextInput =
    normalizeString(locationTextParam) ?? normalizeString(locationParam);
  const locationText =
    locationTextInput ?? (lat !== null && lng !== null ? null : DEFAULT_LOCATION);
  const radiusKm =
    normalizeRadiusKm(
      getQueryParam(req.query?.radiusKm),
      getQueryParam(req.query?.units),
    ) ?? DEFAULT_RADIUS_KM;
  const resolvedLocation = resolveGeoLocation(locationText, lat, lng);
  const locationLabel =
    locationText ??
    (resolvedLocation ? `${resolvedLocation.lat},${resolvedLocation.lng}` : DEFAULT_LOCATION);
  const country = resolvedLocation?.country;

  const client = new ApifyClient({ token });
  const proxy =
    typeof req.query?.proxy === 'string'
      ? req.query.proxy
      : Array.isArray(req.query?.proxy)
      ? req.query.proxy[0]
      : undefined;
  const region =
    typeof req.query?.region === 'string'
      ? req.query.region
      : Array.isArray(req.query?.region)
      ? req.query.region[0]
      : undefined;

  try {
    if (source === 'facebook') {
      const q = (qParam || DEFAULT_FACEBOOK_QUERY).toString();

      if (!resolvedLocation) {
        res.status(400).json({
          error: 'Location must include lat/lng or a supported locationText for facebook search',
        });
        return;
      }

      const result = await runMarketplaceActor('facebook', q, {
        client,
        locationText: locationText ?? undefined,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
        radiusKm,
        country,
        limit,
        proxy,
        region,
      });
      if (result.meta.error) {
        res.status(500).json({ error: result.meta.error.message });
        return;
      }

      res.status(200).json({
        source: 'facebook',
        query: q,
        location: locationLabel,
        count: result.count,
        items: result.items,
      });
      return;
    }

    const q = (qParam || DEFAULT_VINTED_QUERY).toString();
    const result = await runMarketplaceActor('vinted', q, {
      client,
      country,
      limit,
      proxy,
      region,
    });
    if (result.meta.error) {
      res.status(500).json({ error: result.meta.error.message });
      return;
    }

    res.status(200).json({
      source: 'vinted',
      query: q,
      count: result.count,
      items: result.items,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    await handlePost(req, res);
    return;
  }

  if (req.method === 'GET') {
    await handleGet(req, res);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
