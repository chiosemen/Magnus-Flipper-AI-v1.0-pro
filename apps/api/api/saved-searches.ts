import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUserFromJWT } from '../lib/auth';
import { getServiceSupabaseClient } from '../lib/supabase';
import { MARKETPLACES, type MarketplaceId } from '../lib/marketplaceRegistry';
import { getTierPolicy } from '../lib/tierPolicy';

const FREQUENCIES = ['daily', 'weekly'] as const;

type Frequency = (typeof FREQUENCIES)[number];

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

function parseFrequency(input: unknown): Frequency {
  const value = typeof input === 'string' ? input.toLowerCase() : '';
  return FREQUENCIES.includes(value as Frequency) ? (value as Frequency) : 'daily';
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseGeo(input: any) {
  if (!input || typeof input !== 'object') return {};
  const lat = parseNumber(input.lat ?? input.latitude);
  const lng = parseNumber(input.lng ?? input.longitude);
  const radiusKm = parseNumber(input.radiusKm ?? input.radius_km);
  const units = typeof input.units === 'string' ? input.units.toLowerCase() : null;
  const country = typeof input.country === 'string' ? input.country.trim().toUpperCase() : null;
  const locationText =
    typeof input.locationText === 'string' ? input.locationText.trim() : null;
  const postal =
    typeof input.postal === 'string'
      ? input.postal.trim()
      : typeof input.postalCode === 'string'
      ? input.postalCode.trim()
      : null;

  return {
    country: country || null,
    locationText: locationText || null,
    postal: postal || null,
    lat: lat ?? null,
    lng: lng ?? null,
    radiusKm: radiusKm ?? null,
    units: units === 'mi' ? 'mi' : units === 'km' ? 'km' : null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUserFromJWT(req.headers.authorization);
  if (!user.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const supabase = getServiceSupabaseClient();
  const policy = getTierPolicy(user.tier);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    const { data: runs } = await supabase
      .from('alert_runs')
      .select('saved_search_id, started_at, matches_found, meta')
      .eq('user_id', user.userId)
      .order('started_at', { ascending: false });

    const lastRunMap = new Map<string, any>();
    for (const run of runs ?? []) {
      if (!lastRunMap.has(run.saved_search_id)) {
        lastRunMap.set(run.saved_search_id, {
          saved_search_id: run.saved_search_id,
          started_at: run.started_at,
          matches_found: run.matches_found,
          meta: {
            newListings: run.meta?.newListings ?? null,
            priceDrops: run.meta?.priceDrops ?? null,
            suppressionReason: run.meta?.suppressionReason ?? null,
          },
        });
      }
    }

    const savedSearches = (data ?? []).map((search) => ({
      ...search,
      lastRun: lastRunMap.get(search.id) ?? null,
    }));

    res.status(200).json({ savedSearches });
    return;
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    let queries = parseQueries(body.queries ?? body.q);
    if (queries.length === 0) {
      res.status(400).json({ error: 'At least one query is required' });
      return;
    }
    queries = queries.slice(0, policy.maxQueriesPerRun);

    let markets = parseMarkets(body.markets);
    if (markets.length === 0) {
      markets = policy.marketsAllowed.slice();
    }
    const filteredMarkets = markets.filter(
      (market): market is MarketplaceId =>
        market in MARKETPLACES && policy.marketsAllowed.includes(market as MarketplaceId),
    );
    const enabledMarkets = filteredMarkets.filter(
      (market) => MARKETPLACES[market].enabled,
    );
    const trimmedMarkets = enabledMarkets.slice(0, policy.maxMarketsPerRun);
    if (trimmedMarkets.length === 0) {
      res.status(400).json({ error: 'No allowed marketplaces for this tier' });
      return;
    }

    const geo = parseGeo(body.geo) ?? {};
    const frequency = parseFrequency(body.frequency);
    const enabled = body.enabled === false ? false : true;

    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.userId,
        name,
        queries,
        markets: trimmedMarkets,
        geo,
        frequency,
        enabled,
      })
      .select()
      .single();

    if (error || !savedSearch) {
      res.status(500).json({ error: error?.message || 'Failed to save search' });
      return;
    }

    res.status(201).json({ savedSearch });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
