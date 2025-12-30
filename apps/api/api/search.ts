import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { ApifyClient } from 'apify-client';
import { runMarketplaceActor } from '../lib/apifyActors';
import { planPooledRuns, type PoolRequest } from '../lib/geopool';
import {
  MARKETPLACES,
  estimateCuForRun,
  getMarketCapabilities,
  type MarketplaceId,
} from '../lib/marketplaceRegistry';
import { requireUserFromJWT } from '../lib/auth';
import { TIER_POLICIES, type Tier } from '../lib/tierPolicy';
import {
  writeCostLedgerEntries,
  type CostLedgerSource,
  type ProxyType,
} from '../lib/costLedger';

const DEFAULT_FACEBOOK_QUERY = 'iphone';
const DEFAULT_VINTED_QUERY = 'nike';
const DEFAULT_LOCATION = 'london';
const DEFAULT_LIMIT = 20;
const DEFAULT_RADIUS_KM = 50;
const DEFAULT_RUN_TIMEOUT_MS = 120000;

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
  london: { lat: 51.5074, lng: -0.1278, country: 'UK' },
  manchester: { lat: 53.4808, lng: -2.2426, country: 'UK' },
  birmingham: { lat: 52.4862, lng: -1.8904, country: 'UK' },
  "new york": { lat: 40.7128, lng: -74.006, country: 'US' },
  "los angeles": { lat: 34.0522, lng: -118.2437, country: 'US' },
  chicago: { lat: 41.8781, lng: -87.6298, country: 'US' },
  prague: { lat: 50.0755, lng: 14.4378, country: 'CZ' },
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

function resolveProxyType(proxy?: string, region?: string): ProxyType {
  const combined = `${proxy ?? ''} ${region ?? ''}`.toLowerCase();
  return combined.includes('residential') ? 'residential' : 'datacenter';
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

type SearchUser = {
  userId: string | null;
  tier: Tier;
};

type SearchExecutionResult = {
  status: number;
  payload: Record<string, any>;
};

type SearchContext = {
  source?: CostLedgerSource;
  cuCap?: number;
};

export async function executeSearch(
  req: VercelRequest,
  body: Record<string, any>,
  user: SearchUser,
  context: SearchContext = {},
): Promise<SearchExecutionResult> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    return { status: 500, payload: { error: 'APIFY_TOKEN missing' } };
  }

  const policy = TIER_POLICIES[user.tier];
  const debugPooling = process.env.DEBUG_POOLING === 'true';

  let queries = parseQueries(body.q ?? body.queries);
  const requestedQueries = queries.length;
  queries = queries.slice(0, policy.maxQueriesPerRun);

  let markets = parseMarkets(body.markets);
  const requestedMarkets = markets.length;
  if (markets.length === 0) {
    markets = policy.marketsAllowed.slice();
  } else {
    const unsupported = markets.filter((market) => {
      if (!isMarketplaceId(market)) return true;
      return !MARKETPLACES[market].enabled;
    });
    if (unsupported.length > 0) {
      return {
        status: 400,
        payload: { error: `Unsupported marketplaces: ${unsupported.join(', ')}` },
      };
    }

    const disallowed = markets.filter(
      (market) => isMarketplaceId(market) && !policy.marketsAllowed.includes(market),
    );
    if (disallowed.length > 0) {
      return {
        status: 400,
        payload: { error: `${disallowed[0]} is not available on your plan.` },
      };
    }
  }

  const filteredMarkets = markets.filter((market): market is MarketplaceId =>
    isMarketplaceId(market),
  );
  const typedMarkets = filteredMarkets.slice(0, policy.maxMarketsPerRun);

  if (queries.length === 0) {
    return { status: 400, payload: { error: 'No queries provided' } };
  }

  if (typedMarkets.length === 0) {
    return {
      status: 400,
      payload: { error: 'No allowed marketplaces for this tier' },
    };
  }

  const limit = Math.max(1, parseNumber(body.limit, DEFAULT_LIMIT));
  const cuEstimate = estimateCuForRun({
    markets: typedMarkets,
    queries,
    itemsExpected: limit,
  });
  const estimatedCuTotal = cuEstimate.total;
  const estimatedCuByMarket = cuEstimate.byMarket;
  const postalCode = normalizeString(body.postalCode);
  const locationTextInput =
    normalizeString(body.locationText) ?? normalizeString(body.location);
  let lat = parseFloatValue(body.lat ?? body.latitude);
  let lng = parseFloatValue(body.lng ?? body.longitude);
  let resolvedPostal: { postalCode: string; country: string; lat: number; lng: number } | null =
    null;
  const needsGeoResolution = typedMarkets.some((market) => {
    const capabilities = MARKETPLACES[market].geoCapabilities;
    return capabilities.supportsLatLng || capabilities.supportsPostal;
  });
  if (lat === null && lng === null && postalCode && needsGeoResolution) {
    try {
      resolvedPostal = await resolvePostalCode(
        req,
        postalCode,
        normalizeString(body.country) ?? undefined,
      );
      lat = resolvedPostal.lat;
      lng = resolvedPostal.lng;
    } catch (error: any) {
      return {
        status: 400,
        payload: { error: error?.message || 'Postal resolution failed' },
      };
    }
  }
  const locationText =
    locationTextInput ??
    (postalCode ?? null) ??
    (lat !== null && lng !== null ? null : DEFAULT_LOCATION);
  const radiusRequested = normalizeRadiusKm(body.radiusKm, body.units);
  const radiusKm = radiusRequested ?? DEFAULT_RADIUS_KM;
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
  const proxyType = resolveProxyType(proxy, region);
  const country = resolvedLocation?.country ?? resolvedPostal?.country ?? null;

  const marketsNeedingLatLng = typedMarkets.filter((market) => {
    const capabilities = MARKETPLACES[market].geoCapabilities;
    return capabilities.supportsRadiusKm && capabilities.supportsLatLng;
  });
  if (marketsNeedingLatLng.length > 0 && (lat === null || lng === null)) {
    return {
      status: 400,
      payload: {
        error: `Lat/lng required for: ${marketsNeedingLatLng.join(', ')}`,
      },
    };
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
      poolingReason?: string | null;
      timestamp: string;
      warnings: string[];
    }
  >();

  for (const query of queries) {
    for (const market of typedMarkets) {
      const marketConfig = MARKETPLACES[market];
      const capabilities = marketConfig.geoCapabilities;
      const requestId = `${market}-${requests.length + 1}`;
      const radiusKmUsed = capabilities.supportsRadiusKm ? radiusKm : null;
      const latUsed = capabilities.supportsLatLng
        ? resolvedLocation?.lat ?? null
        : null;
      const lngUsed = capabilities.supportsLatLng
        ? resolvedLocation?.lng ?? null
        : null;
      const postalUsed = capabilities.supportsPostal ? postalCode : null;
      const warnings: string[] = [];
      if (!capabilities.supportsRadiusKm && radiusRequested !== null) {
        warnings.push('Radius ignored for this marketplace.');
      }
      if (!capabilities.supportsLatLng && resolvedLocation) {
        warnings.push('Geo coordinates ignored for this marketplace.');
      }
      if (!capabilities.supportsPostal && postalCode) {
        warnings.push('Postal code ignored for this marketplace.');
      }

      const poolingReasons: string[] = [];
      if (!marketConfig.pooling.enabled) {
        poolingReasons.push('Pooling disabled by registry.');
      }
      if (
        radiusKmUsed &&
        marketConfig.pooling.maxRadiusKm > 0 &&
        radiusKmUsed > marketConfig.pooling.maxRadiusKm
      ) {
        poolingReasons.push(
          `Radius exceeds pooling max (${marketConfig.pooling.maxRadiusKm} km).`,
        );
      }
      const pricingModel =
        marketConfig.costModel.pricingModel ??
        (marketConfig.costModel.cuPerItem > 0 ? 'per-result' : 'per-run');
      if (pricingModel === 'per-run' && marketConfig.costModel.pooledSafe === false) {
        poolingReasons.push('Pooling disabled for per-run pricing.');
      }
      if (marketConfig.pooling.key === 'geohash' && !capabilities.supportsLatLng) {
        poolingReasons.push('Pooling disabled: lat/lng unsupported.');
      }
      if (marketConfig.pooling.key === 'postal' && !capabilities.supportsPostal) {
        poolingReasons.push('Pooling disabled: postal unsupported.');
      }

      const poolingOverride =
        poolingReasons.length > 0
          ? { enabled: false, reason: poolingReasons[0] }
          : undefined;

      if (poolingReasons.length > 0) {
        warnings.push(...poolingReasons);
      }

      requests.push({
        requestId,
        userId: user.userId ?? null,
        marketplaceId: market,
        query,
        category: normalizeString(body.category),
        lat: latUsed,
        lng: lngUsed,
        radiusKm: radiusKmUsed,
        postalCode: postalUsed,
        tier: policy.tier,
        maxResults: limit,
        country,
        city: locationUsed?.text ?? null,
        poolingOverride,
      });

      requestMeta.set(requestId, {
        market,
        query,
        locationUsed,
        radiusKmUsed,
        poolingReason: poolingOverride?.reason ?? null,
        timestamp: new Date().toISOString(),
        warnings,
      });

      if (debugPooling) {
        console.log(
          JSON.stringify({
            marketplaceId: market,
            query,
            poolingEnabled: poolingOverride ? poolingOverride.enabled : marketConfig.pooling.enabled,
            poolingReason: poolingOverride?.reason ?? null,
          }),
        );
      }
    }
  }

  const { pooledRuns, mapping } = planPooledRuns(requests, tierRunCaps);
  const cuCap =
    typeof context.cuCap === 'number' ? context.cuCap : policy.cuCapPerRun;
  let cuEstimatedTotal = 0;
  let cuCapReached = false;
  const skippedRunIds = new Set<string>();
  let pooledRunsToExecute = pooledRuns;

  if (typeof cuCap === 'number' && cuCap > 0) {
    pooledRunsToExecute = [];
    for (const pooledRun of pooledRuns) {
      const marketConfig = MARKETPLACES[pooledRun.marketplaceId];
      const estimated = marketConfig.costModel.cuPerRun;
      if (cuEstimatedTotal + estimated > cuCap) {
        skippedRunIds.add(pooledRun.pooledRunId);
        cuCapReached = true;
        continue;
      }
      cuEstimatedTotal += estimated;
      pooledRunsToExecute.push(pooledRun);
    }
  } else {
    cuEstimatedTotal = pooledRuns.reduce(
      (sum, run) => sum + MARKETPLACES[run.marketplaceId].costModel.cuPerRun,
      0,
    );
  }

  const runOptions = buildRunOptions(policy.tier, limit);
  const buildTask = (pooledRun: (typeof pooledRunsToExecute)[number]) => async () => {
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
        postalCode: pooledRun.postalCode ?? undefined,
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
  };

  const vintedRuns = pooledRunsToExecute.filter(
    (run) => run.marketplaceId === 'vinted',
  );
  const otherRuns = pooledRunsToExecute.filter(
    (run) => run.marketplaceId !== 'vinted',
  );

  const runTasks = async (
    runs: typeof pooledRunsToExecute,
    limit: number,
  ) => {
    if (runs.length === 0) return [];
    return runPool(runs.map(buildTask), Math.max(1, limit));
  };

  const vintedConcurrency =
    MARKETPLACES.vinted.pooling.maxConcurrency ?? 1;
  const [vintedResults, otherResults] = await Promise.all([
    runTasks(vintedRuns, vintedConcurrency),
    runTasks(otherRuns, policy.maxConcurrency),
  ]);

  const pooledResults = [...vintedResults, ...otherResults];
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
    if (skippedRunIds.has(pooledRun.pooledRunId)) {
      errors.push({
        marketplaceId: pooledRun.marketplaceId,
        code: 'CU_CAP',
        message: 'Skipped due to CU cap',
        classified: 'LIMIT',
      });
      continue;
    }
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

  if (user.userId) {
    const source = context.source ?? 'search';
    const executedAt = new Date().toISOString();
    const ledgerEntries = pooledRuns.map((pooledRun) => {
      const pooledResult = pooledResultMap.get(pooledRun.pooledRunId);
      const runResult = pooledResult && !('error' in pooledResult) ? pooledResult.result : null;
      const marketConfig = MARKETPLACES[pooledRun.marketplaceId];
      const itemsCount = runResult?.items?.length ?? 0;
      const baseCu = marketConfig.costModel.cuPerRun;
      const perItemCu = marketConfig.costModel.cuPerItem;
      const pricingModel =
        marketConfig.costModel.pricingModel ??
        (marketConfig.costModel.cuPerItem > 0 ? 'per-result' : 'per-run');
      const cuEstimated =
        pricingModel === 'per-result' ? baseCu + itemsCount * perItemCu : baseCu;
      return {
        userId: user.userId as string,
        runId: randomUUID(),
        source,
        marketplace: pooledRun.marketplaceId,
        actorId: runResult?.actorId ?? marketConfig.actorId,
        cuEstimated,
        cuActual: cuEstimated,
        proxyType,
        executedAt,
      };
    });
    await writeCostLedgerEntries(ledgerEntries);
  }

  const results = mapping.map((entry) => {
    const meta = requestMeta.get(entry.requestId);
    const pooledRun = pooledRunMap.get(entry.pooledRunId);
    const pooled = pooledRun ? pooledRun.requestIds.length > 1 : false;
    const pooledResult = pooledResultMap.get(entry.pooledRunId);
    const poolingReason = meta?.poolingReason ?? null;
    const warnings = [
      ...(meta?.warnings ?? []),
      ...(entry.warnings ?? []),
      ...(pooledRun?.warnings ?? []),
    ];

    const skipped = skippedRunIds.has(entry.pooledRunId);
    if (!meta || !pooledResult || 'error' in pooledResult) {
      if (skipped) {
        warnings.push('Skipped due to CU cap.');
      }
      return {
        market: meta?.market ?? entry.marketplaceId,
        query: meta?.query ?? 'unknown',
        locationUsed: meta?.locationUsed ?? null,
        radiusKmUsed: meta?.radiusKmUsed ?? null,
        timestamp: meta?.timestamp ?? new Date().toISOString(),
        count: 0,
        items: [],
        durationMs: 0,
        error: skipped
          ? 'Skipped due to CU cap'
          : pooledResult && 'error' in pooledResult
          ? pooledResult.error?.message || pooledResult.error || 'Search failed'
          : 'Search failed',
        pooling: pooledRun
          ? {
              pooled,
              geoKey: pooledRun.geoKey,
              precision: pooledRun.precision,
              strategy: pooledRun.pooling.strategy,
              poolingApplied: pooledRun.pooling.enabled,
              poolingKey: pooledRun.geoKey,
              poolingReason,
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
            poolingApplied: pooledRun.pooling.enabled,
            poolingKey: pooledRun.geoKey,
            poolingReason,
          }
        : null,
      warnings: warnings.length > 0 ? Array.from(new Set(warnings)) : undefined,
    };
  });

  const poolingApplied = pooledRuns.some(
    (run) => run.pooling.enabled && run.pooling.strategy !== 'none',
  );
  const poolingKeys = Array.from(new Set(pooledRuns.map((run) => run.geoKey)));
  const poolingReasons = Array.from(
    new Set(
      Array.from(requestMeta.values())
        .map((meta) => meta.poolingReason)
        .filter((reason): reason is string => Boolean(reason)),
    ),
  );
  const metaWarnings = Array.from(
    new Set(results.flatMap((entry) => entry.warnings ?? [])),
  );

  const poolingPrecisions = Array.from(
    new Set(
      pooledRuns
        .map((run) => run.precision)
        .filter((value): value is number => value !== null),
    ),
  );

  const marketCapabilities = Object.fromEntries(
    typedMarkets.map((market) => {
      const capabilities = getMarketCapabilities(market);
      return [
        market,
        {
          supportsRadiusKm: capabilities.supportsRadiusKm,
          supportsPostal: capabilities.supportsPostal,
          supportsLatLng: capabilities.supportsLatLng,
          supportsCountry: capabilities.supportsCountry,
        },
      ];
    }),
  );

  const radiusIgnoredMarkets =
    radiusRequested !== null
      ? typedMarkets.filter(
          (market) => !MARKETPLACES[market].geoCapabilities.supportsRadiusKm,
        )
      : [];

  return {
    status: 200,
    payload: {
      tier: policy.tier,
      policy: {
        maxQueriesPerRun: policy.maxQueriesPerRun,
        maxMarketsPerRun: policy.maxMarketsPerRun,
        maxConcurrency: policy.maxConcurrency,
        marketsAllowed: policy.marketsAllowed,
        dailyRunLimit: policy.dailyRunLimit,
        dailyCuLimit: policy.dailyCuLimit,
        cuCapPerRun: policy.cuCapPerRun,
      },
      requestedQueries,
      requestedMarkets,
      executedQueries: queries,
      markets: typedMarkets,
      stats: {
        totalTasks: pooledRunsToExecute.length,
        concurrency: policy.maxConcurrency,
      },
      results,
      errors,
      meta: {
        marketCapabilities,
        radiusIgnoredMarkets,
        estimatedCuTotal,
        estimatedCuByMarket,
        pooledRuns: pooledRunsToExecute.length,
        pooledRunsPlanned: pooledRuns.length,
        poolingEnabled: pooledRuns.some((run) => run.pooling.enabled),
        poolingApplied,
        poolingKey: poolingKeys[0] ?? null,
        poolingReason: poolingReasons[0] ?? null,
        proxyOverrideApplied: typedMarkets.includes('vinted'),
        warnings: metaWarnings.length > 0 ? metaWarnings : undefined,
        errorCount: errors.length,
        cuEstimated: cuEstimatedTotal,
        cuCap: typeof cuCap === 'number' ? cuCap : null,
        cuCapReached,
        skippedRuns: skippedRunIds.size,
        pooling: {
          applied: poolingApplied,
          keys: poolingKeys,
          precisions: poolingPrecisions,
        },
      },
    },
  };
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const user = await requireUserFromJWT(req.headers.authorization);
  const body = parseBody(req);
  const result = await executeSearch(req, body, user, { source: 'search' });
  res.status(result.status).json(result.payload);
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
