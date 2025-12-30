import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import {
  redis,
  nowSec,
  normalizeQuery,
  searchKey,
  ingestKey,
  lockKey,
  ttlFor,
} from '../lib/redis';
import { requireUserFromJWT } from '../lib/auth';
import { getMarketAgentEntitlement } from '../lib/entitlements';
import {
  checkUsageLimits,
  incrementDailyRollup,
  logUsageEvent,
} from '../lib/usageMetering';

type Marketplace = 'facebook' | 'vinted' | 'gumtree';

const QuerySchema = z.object({
  q: z.string().trim().max(120).default(''),
  marketplace: z.enum(['facebook', 'vinted', 'gumtree']).default('gumtree'),
  country: z.string().trim().min(2).max(3).default('GB'),
  maxItems: z.coerce.number().min(1).max(100).default(40),
  mode: z.enum(['search', 'enrich']).default('search'),
});

const EnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

type Listing = {
  source: Marketplace;
  title: string;
  priceText: string;
  url: string;
  image?: string;
  badge: 'verified' | 'live-capture' | 'recent' | 'in-progress';
  freshnessSeconds: number;
};

type CachedPayload = {
  items: Omit<Listing, 'badge' | 'freshnessSeconds'>[];
  createdAt: number;
  strategy: 'apify' | 'browser-first';
};

type ErrorResponse = {
  ok: false;
  error_code: string;
  error: string;
  request_id: string;
  details?: Record<string, any>;
};

function getBoolParam(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return value === 'true' || value === '1';
}

function logEvent(level: 'info' | 'warn' | 'error', payload: Record<string, any>) {
  const line = {
    level,
    ts: new Date().toISOString(),
    ...payload,
  };
  const method = level === 'error' ? console.error : console.log;
  method(JSON.stringify(line));
}

function respondError(
  res: VercelResponse,
  status: number,
  requestId: string,
  errorCode: string,
  message: string,
  details?: Record<string, any>,
) {
  const payload: ErrorResponse = {
    ok: false,
    error_code: errorCode,
    error: message,
    request_id: requestId,
    details,
  };
  res.status(status).json(payload);
}

async function apifyRunSyncGet(actorId: string, input: any) {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('Missing APIFY_TOKEN');
  if (!actorId) throw new Error('Missing actorId for marketplace');

  const url = `https://api.apify.com/v2/acts/${encodeURIComponent(
    actorId,
  )}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Apify ${r.status}: ${text.slice(0, 300)}`);
  }
  return r.json();
}

function normalizeApifyItem(marketplace: Marketplace, raw: any) {
  return {
    source: marketplace,
    title: raw.title ?? raw.name ?? '',
    priceText: raw.priceText ?? raw.price ?? '',
    url: raw.url ?? raw.link ?? '',
    image: raw.image ?? raw.img ?? (Array.isArray(raw.images) ? raw.images[0] : ''),
  };
}

function decorate(
  items: Omit<Listing, 'badge' | 'freshnessSeconds'>[],
  createdAt: number,
  internalBadge: 'enriched' | 'browser' | 'cached' | 'stale',
): Listing[] {
  const age = Math.max(0, nowSec() - createdAt);
  const badge: Listing['badge'] =
    internalBadge === 'enriched'
      ? 'verified'
      : internalBadge === 'browser'
      ? 'live-capture'
      : 'recent';

  return items.map((it) => ({
    ...it,
    badge,
    freshnessSeconds: age,
  }));
}

function getQueryParams(req: VercelRequest) {
  if (req.method === 'POST') {
    return {
      ...req.query,
      ...(typeof req.body === 'object' && req.body ? req.body : {}),
    };
  }
  return req.query;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const env = EnvSchema.safeParse(process.env);

  if (!env.success) {
    logEvent('error', { request_id: requestId, issues: env.error.issues });
    respondError(res, 500, requestId, 'env_missing', 'Redis env missing');
    return;
  }

  const queryParams = getQueryParams(req);
  const parsed = QuerySchema.safeParse(queryParams);

  if (!parsed.success) {
    respondError(res, 400, requestId, 'invalid_input', 'Invalid request', {
      issues: parsed.error.issues,
    });
    return;
  }

  const marketplace = parsed.data.marketplace as Marketplace;
  const country = parsed.data.country.toUpperCase();
  const mode = parsed.data.mode;
  const demoMode = getBoolParam(queryParams.demo);
  const qNorm = normalizeQuery(parsed.data.q || '');
  const maxItems = demoMode ? Math.min(parsed.data.maxItems, 10) : parsed.data.maxItems;

  if (mode === 'enrich' && req.method !== 'POST') {
    respondError(res, 405, requestId, 'method_not_allowed', 'POST required for enrich');
    return;
  }

  if (!qNorm) {
    respondError(res, 400, requestId, 'missing_query', 'Query is required');
    return;
  }

  let userId: string | null = null;
  let entitlementStatus: string | null = null;

  if (!demoMode) {
    const user = await requireUserFromJWT(req.headers.authorization);
    if (!user.userId) {
      respondError(res, 401, requestId, 'unauthorized', 'Authorization required');
      return;
    }
    const entitlement = await getMarketAgentEntitlement(user.userId);
    userId = user.userId;
    entitlementStatus = entitlement.status;

    if (!entitlement.enabled) {
      respondError(res, 403, requestId, 'entitlement_required', 'Market Agent access required', {
        status: entitlement.status,
        graceUntil: entitlement.graceUntil?.toISOString() ?? null,
        upgrade_hint: 'Subscribe to Market Agent to enable this endpoint.',
      });
      return;
    }
  }

  const sk = searchKey(marketplace, country, qNorm);
  const lk = lockKey(marketplace, country, qNorm);
  const ik = ingestKey(marketplace, country, qNorm);

  if (mode === 'enrich') {
    let body: any = req.body;
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch {
        respondError(res, 400, requestId, 'invalid_json', 'Invalid JSON body');
        return;
      }
    }
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) {
      respondError(res, 400, requestId, 'missing_items', 'Enrich payload requires items');
      return;
    }

    const normalized = items.map((x: any) => ({
      source: (x.source || marketplace) as Marketplace,
      title: x.title || '',
      priceText: x.priceText || '',
      url: x.url || '',
      image: x.image || '',
    }));

    await redis.set(
      ik,
      { items: normalized, ingestedAt: nowSec() },
      { ex: ttlFor(marketplace) },
    );

    if (userId) {
      try {
        await logUsageEvent({
          userId,
          eventType: 'seed_ingest',
          marketplace,
          queryNorm: qNorm,
          itemsReturned: normalized.length,
          cacheStatus: 'browser-seed',
          strategy: 'browser-first',
          latencyMs: Date.now() - startedAt,
          billable: false,
        });
        await incrementDailyRollup({
          userId,
          eventType: 'seed_ingest',
          queryNorm: qNorm,
          itemsReturned: normalized.length,
          billable: false,
        });
      } catch (error: any) {
        logEvent('error', {
          request_id: requestId,
          error: error?.message,
          mode,
          marketplace,
          qNorm,
        });
        respondError(res, 500, requestId, 'usage_write_failed', 'Usage tracking failed');
        return;
      }
    }

    res.status(200).json({
      ok: true,
      mode: 'enrich',
      marketplace,
      country,
      items: decorate(normalized, nowSec(), 'browser'),
      meta: {
        cached: false,
        cacheStatus: 'browser-seed',
        strategy: 'browser-first',
        ageSeconds: null,
        latencyMs: Date.now() - startedAt,
        request_id: requestId,
      },
    });
    return;
  }

  let cacheStatus = 'miss';
  let strategy: 'apify' | 'browser-first' = 'browser-first';
  let items: Omit<Listing, 'badge' | 'freshnessSeconds'>[] = [];
  let createdAt = nowSec();
  let apifyFailure: string | null = null;

  const cached = await redis.get<CachedPayload>(sk);
  if (cached?.items?.length) {
    cacheStatus = 'hit';
    items = cached.items;
    createdAt = cached.createdAt;
    strategy = cached.strategy;
    res.status(200).json({
      ok: true,
      items: decorate(items, createdAt, 'cached'),
      meta: {
        marketplace,
        country,
        cached: true,
        cacheStatus,
        strategy,
        ageSeconds: nowSec() - createdAt,
        ttlSeconds: ttlFor(marketplace),
        latencyMs: Date.now() - startedAt,
        request_id: requestId,
      },
    });
    return;
  }

  if (userId) {
    try {
      const usage = await checkUsageLimits(userId);
      if (!usage.allowed) {
        respondError(res, 429, requestId, 'usage_limit', 'Usage limit reached', {
          usage: usage.current,
          entitlementStatus,
        });
        return;
      }
    } catch (error: any) {
      logEvent('error', {
        request_id: requestId,
        error: error?.message,
        marketplace,
        qNorm,
      });
      respondError(res, 500, requestId, 'usage_read_failed', 'Usage lookup failed');
      return;
    }
  }

  let lockAcquired = false;
  try {
    lockAcquired = Boolean(await redis.set(lk, '1', { nx: true, ex: 20 }));

    if (!lockAcquired) {
      const seeded = await redis.get<{ items: any[]; ingestedAt: number }>(ik);
      if (seeded?.items?.length) {
        cacheStatus = 'lock-busy-stale';
        const seededItems = seeded.items.map((x) => ({
          source: marketplace,
          title: x.title || '',
          priceText: x.priceText || '',
          url: x.url || '',
          image: x.image || '',
        }));
        res.status(200).json({
          ok: true,
          items: decorate(seededItems, seeded.ingestedAt, 'stale'),
          meta: {
            marketplace,
            country,
            cached: false,
            cacheStatus,
            strategy: 'browser-first',
            note: 'Served ingest while run in flight',
            ageSeconds: nowSec() - seeded.ingestedAt,
            latencyMs: Date.now() - startedAt,
            request_id: requestId,
          },
        });
        return;
      }

      respondError(res, 409, requestId, 'lock_busy', 'Request already in flight');
      return;
    }

    if (marketplace === 'gumtree') {
      strategy = 'apify';
      const actorId = process.env.APIFY_ACTOR_GUMTREE || '';

      if (actorId) {
        try {
          const rawItems = await apifyRunSyncGet(actorId, {
            query: parsed.data.q,
            maxItems,
            country,
          });
          items = rawItems.map((r: any) => normalizeApifyItem('gumtree', r));
        } catch (error: any) {
          apifyFailure = error?.message || 'Apify failed';
          logEvent('warn', {
            request_id: requestId,
            error: apifyFailure,
            marketplace,
            qNorm,
            strategy: 'apify',
          });
          items = [];
          strategy = 'browser-first';
        }
      } else {
        apifyFailure = 'Apify actor not configured';
        strategy = 'browser-first';
      }
    }

    if (strategy === 'browser-first' || items.length === 0) {
      const seeded = await redis.get<{ items: any[]; ingestedAt: number }>(ik);
      if (seeded?.items?.length) {
        items = seeded.items.map((x) => ({
          source: marketplace,
          title: x.title || '',
          priceText: x.priceText || '',
          url: x.url || '',
          image: x.image || '',
        }));
        createdAt = seeded.ingestedAt;
        strategy = 'browser-first';
      }
    }

    if (items.length === 0 && apifyFailure) {
      respondError(res, 500, requestId, 'apify_failed', apifyFailure);
      return;
    }

    const toCache: CachedPayload = {
      items: items.map(({ source, title, priceText, url, image }) => ({
        source,
        title,
        priceText,
        url,
        image,
      })),
      createdAt,
      strategy,
    };

    if (toCache.items.length) {
      cacheStatus = 'miss-filled';
      await redis.set(sk, toCache, { ex: ttlFor(marketplace) });
    } else if (strategy === 'apify') {
      cacheStatus = 'miss-empty';
      await redis.set(sk, toCache, { ex: 30 });
    } else {
      cacheStatus = 'miss-empty';
    }

    const billable = strategy === 'apify' && cacheStatus !== 'hit';

    if (userId) {
      try {
        await logUsageEvent({
          userId,
          eventType: 'run',
          marketplace,
          queryNorm: qNorm,
          itemsReturned: toCache.items.length,
          cacheStatus,
          strategy,
          latencyMs: Date.now() - startedAt,
          billable,
        });
        await incrementDailyRollup({
          userId,
          eventType: 'run',
          queryNorm: qNorm,
          itemsReturned: toCache.items.length,
          billable,
        });
      } catch (error: any) {
        logEvent('error', {
          request_id: requestId,
          error: error?.message,
          marketplace,
          qNorm,
        });
        respondError(res, 500, requestId, 'usage_write_failed', 'Usage tracking failed');
        return;
      }
    }

    res.status(200).json({
      ok: true,
      items: decorate(
        toCache.items,
        createdAt,
        toCache.strategy === 'apify' ? 'enriched' : 'browser',
      ),
      meta: {
        marketplace,
        country,
        cached: false,
        cacheStatus,
        strategy,
        ageSeconds: Math.max(0, nowSec() - createdAt),
        ttlSeconds: ttlFor(marketplace),
        latencyMs: Date.now() - startedAt,
        request_id: requestId,
      },
    });
  } catch (error: any) {
    logEvent('error', {
      request_id: requestId,
      error: error?.message,
      marketplace,
      qNorm,
      cacheStatus,
      strategy,
    });
    respondError(res, 500, requestId, 'server_error', 'Market Agent failed');
  } finally {
    if (lockAcquired) {
      try {
        await redis.del(lk);
      } catch (error: any) {
        logEvent('error', {
          request_id: requestId,
          error: error?.message,
          marketplace,
          qNorm,
          lock: 'release_failed',
        });
      }
    }
    logEvent('info', {
      request_id: requestId,
      path: req.url ?? '/api/demo',
      marketplace,
      qNorm,
      cacheStatus,
      strategy,
      latencyMs: Date.now() - startedAt,
    });
  }
}
