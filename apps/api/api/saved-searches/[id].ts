import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUserFromJWT } from '../../lib/auth';
import { getServiceSupabaseClient } from '../../lib/supabase';
import { MARKETPLACES, type MarketplaceId } from '../../lib/marketplaceRegistry';
import { getTierPolicy } from '../../lib/tierPolicy';

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

  const id = typeof req.query?.id === 'string' ? req.query.id : null;
  if (!id) {
    res.status(400).json({ error: 'Saved search id is required' });
    return;
  }

  const supabase = getServiceSupabaseClient();
  const policy = getTierPolicy(user.tier);

  if (req.method === 'PATCH') {
    const body = parseBody(req);
    const updates: Record<string, any> = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (body.queries || body.q) {
      let queries = parseQueries(body.queries ?? body.q);
      if (queries.length === 0) {
        res.status(400).json({ error: 'At least one query is required' });
        return;
      }
      updates.queries = queries.slice(0, policy.maxQueriesPerRun);
    }

    if (body.markets) {
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
      updates.markets = trimmedMarkets;
    }

    if (body.geo) {
      updates.geo = parseGeo(body.geo);
    }

    if (body.frequency) {
      updates.frequency = parseFrequency(body.frequency);
    }

    if (body.enabled !== undefined) {
      updates.enabled = Boolean(body.enabled);
    }

    const { data, error } = await supabase
      .from('saved_searches')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.userId)
      .select()
      .single();

    if (error || !data) {
      res.status(500).json({ error: error?.message || 'Failed to update search' });
      return;
    }

    res.status(200).json({ savedSearch: data });
    return;
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.userId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(204).send('');
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
