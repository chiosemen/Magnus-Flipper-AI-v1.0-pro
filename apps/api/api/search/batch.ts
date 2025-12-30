import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { runMarketplaceActor } from '../../lib/apifyActors';
import { MARKETPLACES, type MarketplaceId } from '../../lib/marketplaceRegistry';
import {
  resolveEntitlement,
  validateBatchRequestAgainstEntitlement,
  type Entitlement,
} from '../../lib/entitlements';

type GeoRegion = 'UK' | 'US' | 'EU' | 'AU';
type ProxyMode = 'residential' | 'datacenter';

type QueryPayload = {
  query: string;
  markets: MarketplaceId[];
  geo: GeoRegion;
  proxy?: ProxyMode;
};

type RequestOptions = {
  maxResultsPerMarket?: number;
  deduplicate?: boolean;
  timeoutMs?: number;
};

type BatchRequest = {
  queries: QueryPayload[];
  options?: RequestOptions;
};

const GEO_PROXY_MAP: Record<GeoRegion, { country: string; proxyGroup: ProxyMode }> = {
  UK: { country: 'GB', proxyGroup: 'residential' },
  US: { country: 'US', proxyGroup: 'residential' },
  EU: { country: 'DE', proxyGroup: 'residential' },
  AU: { country: 'AU', proxyGroup: 'residential' },
};

const DEFAULT_OPTIONS: Required<RequestOptions> = {
  maxResultsPerMarket: 20,
  deduplicate: true,
  timeoutMs: 15000,
};

function parseBody(req: VercelRequest): unknown {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
}

function isMarketplaceId(value: string): value is MarketplaceId {
  return value in MARKETPLACES;
}

function validateRequest(body: unknown): { ok: true; data: BatchRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body' };
  const payload = body as Record<string, unknown>;
  const queries = Array.isArray(payload.queries) ? payload.queries : null;
  if (!queries || queries.length === 0) return { ok: false, error: 'queries must be a non-empty array' };
  if (queries.length > 10) return { ok: false, error: 'queries length must be <= 10' };

  const parsedQueries: QueryPayload[] = [];
  for (const [idx, entry] of queries.entries()) {
    if (!entry || typeof entry !== 'object') {
      return { ok: false, error: `queries[${idx}] must be an object` };
    }
    const query = typeof (entry as any).query === 'string' ? (entry as any).query.trim() : '';
    if (!query || query.length > 256) {
      return { ok: false, error: `queries[${idx}].query must be 1-256 chars` };
    }
    const marketsRaw = Array.isArray((entry as any).markets) ? (entry as any).markets : [];
    if (!marketsRaw.length) return { ok: false, error: `queries[${idx}].markets must be a non-empty array` };
    const markets: MarketplaceId[] = [];
    for (const m of marketsRaw) {
      const mStr = String(m).toLowerCase();
      if (!isMarketplaceId(mStr)) {
        return { ok: false, error: `queries[${idx}].markets contains unsupported market: ${mStr}` };
      }
      markets.push(mStr);
    }
    const geo = typeof (entry as any).geo === 'string' ? ((entry as any).geo as string).toUpperCase() : '';
    if (!['UK', 'US', 'EU', 'AU'].includes(geo)) {
      return { ok: false, error: `queries[${idx}].geo must be one of UK | US | EU | AU` };
    }
    const proxyRaw = (entry as any).proxy;
    const proxy = proxyRaw ? String(proxyRaw).toLowerCase() : undefined;
    if (proxy && proxy !== 'residential' && proxy !== 'datacenter') {
      return { ok: false, error: `queries[${idx}].proxy must be residential or datacenter if provided` };
    }
    parsedQueries.push({
      query,
      markets,
      geo: geo as GeoRegion,
      proxy: proxy as ProxyMode | undefined,
    });
  }

  const optionsRaw = (payload.options || {}) as Record<string, unknown>;
  const options: RequestOptions = {
    maxResultsPerMarket:
      typeof optionsRaw.maxResultsPerMarket === 'number' && Number.isFinite(optionsRaw.maxResultsPerMarket)
        ? Math.max(1, Math.min(100, optionsRaw.maxResultsPerMarket))
        : DEFAULT_OPTIONS.maxResultsPerMarket,
    deduplicate:
      typeof optionsRaw.deduplicate === 'boolean' ? optionsRaw.deduplicate : DEFAULT_OPTIONS.deduplicate,
    timeoutMs:
      typeof optionsRaw.timeoutMs === 'number' && Number.isFinite(optionsRaw.timeoutMs)
        ? Math.max(1000, Math.min(300000, optionsRaw.timeoutMs))
        : DEFAULT_OPTIONS.timeoutMs,
  };

  return { ok: true, data: { queries: parsedQueries, options } };
}

function dedupeItems<T extends Record<string, any>>(items: T[]) {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    const key =
      (typeof item.url === 'string' && item.url) ||
      (typeof item.listingUrl === 'string' && item.listingUrl) ||
      (typeof item.permalink === 'string' && item.permalink) ||
      JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const parsed = validateRequest(parseBody(req));
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const userId = (req.headers['x-user-id'] as string) || null;
  const stripePriceId = (req.headers['x-stripe-price'] as string) || null;
  const entitlement: Entitlement = resolveEntitlement({ userId, stripePriceId });

  const violation = validateBatchRequestAgainstEntitlement(entitlement, {
    queries: parsed.data.queries.map((q) => ({ markets: q.markets, geo: q.geo })),
  });
  if (violation) {
    res.status(403).json({
      error: violation.message,
      code: violation.code,
      upgrade: violation.upgradeHint,
    });
    return;
  }

  const { queries, options } = parsed.data;
  const requestId = randomUUID();

  const responseQueries: Array<{
    query: string;
    geo: GeoRegion;
    results: Record<
      MarketplaceId,
      { items: any[]; latencyMs: number; success: boolean; error?: string }
    >;
  }> = [];

  let totalItems = 0;

  for (const q of queries) {
    const geoConfig = GEO_PROXY_MAP[q.geo];
    const results: Record<
      MarketplaceId,
      { items: any[]; latencyMs: number; success: boolean; error?: string }
    > = {} as any;

    for (const market of q.markets) {
      const started = Date.now();
      try {
        const run = await runMarketplaceActor(market, q.query, {
          country: geoConfig.country,
          proxy: q.proxy ?? geoConfig.proxyGroup,
          runOptions: { timeoutMs: options.timeoutMs },
          limit: options.maxResultsPerMarket,
        });
        const items = options.deduplicate ? dedupeItems(run.items || []) : run.items || [];
        totalItems += items.length;
        results[market] = {
          items,
          latencyMs: Date.now() - started,
          success: true,
        };
      } catch (err: any) {
        results[market] = {
          items: [],
          latencyMs: Date.now() - started,
          success: false,
          error: err?.message || 'Search failed',
        };
      }
    }

    responseQueries.push({
      query: q.query,
      geo: q.geo,
      results,
    });
  }

  res.status(200).json({
    requestId,
    queries: responseQueries,
    meta: {
      totalQueries: responseQueries.length,
      totalItems,
      executionMode: 'sequential',
      timestamp: new Date().toISOString(),
      entitlement: {
        plan: entitlement.plan,
        maxQueriesPerBatch: entitlement.maxQueriesPerBatch,
        markets: entitlement.markets,
        geo: entitlement.geo,
      },
    },
  });
}
