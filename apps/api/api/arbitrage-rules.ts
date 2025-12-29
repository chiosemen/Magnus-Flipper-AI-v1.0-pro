import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUserFromJWT } from '../lib/auth';
import { getServiceSupabaseClient } from '../lib/supabase';
import { MARKETPLACES, type MarketplaceId } from '../lib/marketplaceRegistry';
import { getTierPolicy } from '../lib/tierPolicy';

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

function parseMarket(input: unknown): MarketplaceId | null {
  if (typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  return value in MARKETPLACES ? (value as MarketplaceId) : null;
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
  if (!input || typeof input !== 'object') return null;
  const lat = parseNumber(input.lat ?? input.latitude);
  const lng = parseNumber(input.lng ?? input.longitude);
  const radiusKm = parseNumber(input.radiusKm ?? input.radius_km);
  const country = typeof input.country === 'string' ? input.country.trim().toUpperCase() : null;
  if (lat === null || lng === null) return null;
  return {
    lat,
    lng,
    radiusKm: radiusKm ?? null,
    country: country || null,
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
      .from('arbitrage_rules')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ rules: data ?? [] });
    return;
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
    const buyMarket = parseMarket(body.buy_market);
    const sellMarket = parseMarket(body.sell_market);
    if (!buyMarket || !sellMarket) {
      res.status(400).json({ error: 'buy_market and sell_market are required' });
      return;
    }
    if (buyMarket === sellMarket) {
      res.status(400).json({ error: 'buy_market and sell_market must differ' });
      return;
    }
    if (!MARKETPLACES[buyMarket].enabled || !MARKETPLACES[sellMarket].enabled) {
      res.status(400).json({ error: 'Selected marketplaces are disabled' });
      return;
    }
    if (!policy.marketsAllowed.includes(buyMarket) || !policy.marketsAllowed.includes(sellMarket)) {
      res.status(403).json({ error: 'Marketplace not allowed for this tier' });
      return;
    }

    let queries = parseQueries(body.queries ?? body.q);
    if (queries.length === 0) {
      res.status(400).json({ error: 'At least one query is required' });
      return;
    }
    queries = queries.slice(0, policy.maxQueriesPerRun);

    const minProfitPct = parseNumber(body.min_profit_pct ?? body.minProfitPct) ?? 0;
    const minProfitAbs = parseNumber(body.min_profit_abs ?? body.minProfitAbs) ?? 0;
    const geo = parseGeo(body.geo) ?? null;
    const enabled = body.enabled === false ? false : true;

    const { data: rule, error } = await supabase
      .from('arbitrage_rules')
      .insert({
        user_id: user.userId,
        buy_market: buyMarket,
        sell_market: sellMarket,
        queries,
        min_profit_pct: minProfitPct,
        min_profit_abs: minProfitAbs,
        geo,
        enabled,
      })
      .select()
      .single();

    if (error || !rule) {
      res.status(500).json({ error: error?.message || 'Failed to create rule' });
      return;
    }
    res.status(201).json({ rule });
    return;
  }

  if (req.method === 'PATCH') {
    const body = parseBody(req);
    const id = typeof body.id === 'string' ? body.id : null;
    if (!id) {
      res.status(400).json({ error: 'Rule id is required' });
      return;
    }

    const updates: Record<string, any> = {};
    if (body.buy_market || body.sell_market) {
      const buyMarket = parseMarket(body.buy_market);
      const sellMarket = parseMarket(body.sell_market);
      if (!buyMarket || !sellMarket) {
        res.status(400).json({ error: 'buy_market and sell_market are required' });
        return;
      }
      if (buyMarket === sellMarket) {
        res.status(400).json({ error: 'buy_market and sell_market must differ' });
        return;
      }
      if (!MARKETPLACES[buyMarket].enabled || !MARKETPLACES[sellMarket].enabled) {
        res.status(400).json({ error: 'Selected marketplaces are disabled' });
        return;
      }
      if (!policy.marketsAllowed.includes(buyMarket) || !policy.marketsAllowed.includes(sellMarket)) {
        res.status(403).json({ error: 'Marketplace not allowed for this tier' });
        return;
      }
      updates.buy_market = buyMarket;
      updates.sell_market = sellMarket;
    }

    if (body.queries || body.q) {
      let queries = parseQueries(body.queries ?? body.q);
      if (queries.length === 0) {
        res.status(400).json({ error: 'At least one query is required' });
        return;
      }
      updates.queries = queries.slice(0, policy.maxQueriesPerRun);
    }

    if (body.min_profit_pct !== undefined || body.minProfitPct !== undefined) {
      updates.min_profit_pct =
        parseNumber(body.min_profit_pct ?? body.minProfitPct) ?? 0;
    }
    if (body.min_profit_abs !== undefined || body.minProfitAbs !== undefined) {
      updates.min_profit_abs =
        parseNumber(body.min_profit_abs ?? body.minProfitAbs) ?? 0;
    }
    if (body.geo) {
      updates.geo = parseGeo(body.geo);
    }
    if (typeof body.enabled === 'boolean') {
      updates.enabled = body.enabled;
    }

    const { data, error } = await supabase
      .from('arbitrage_rules')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.userId)
      .select()
      .single();

    if (error || !data) {
      res.status(500).json({ error: error?.message || 'Failed to update rule' });
      return;
    }
    res.status(200).json({ rule: data });
    return;
  }

  if (req.method === 'DELETE') {
    const body = parseBody(req);
    const id = typeof body.id === 'string' ? body.id : null;
    if (!id) {
      res.status(400).json({ error: 'Rule id is required' });
      return;
    }

    const { error } = await supabase
      .from('arbitrage_rules')
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
