import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeSearch } from '../search';
import { requireUserFromJWT } from '../../lib/auth';
import { getServiceSupabaseClient } from '../../lib/supabase';
import { getTierPolicy } from '../../lib/tierPolicy';
import { MARKETPLACES, type MarketplaceId } from '../../lib/marketplaceRegistry';
import { haversineKm } from '../../lib/geopool';

type ArbitrageRule = {
  id: string;
  user_id: string;
  buy_market: string;
  sell_market: string;
  queries: string[];
  min_profit_pct: number;
  min_profit_abs: number;
  geo: { lat?: number; lng?: number; radiusKm?: number; country?: string } | null;
  enabled: boolean;
};

type MatchCandidate = {
  market: MarketplaceId;
  query: string;
  title: string;
  price: number | null;
  url: string;
  lat: number | null;
  lng: number | null;
  raw: any;
};

const MAX_MATCHES_PER_RUN = 50;
const ARBITRAGE_CU_CAPS = {
  free: 3,
  pro: 8,
  agency: 15,
  enterprise: 25,
};

// Decision intelligence only: this module surfaces opportunities without automation.

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

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeTitle(title: string): string[] {
  return normalizeTitle(title).split(' ').filter(Boolean);
}

function tokenSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = Array.from(setA).filter((token) => setB.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function extractBrand(tokens: string[]): string | null {
  return tokens.length > 0 ? tokens[0] : null;
}

function extractModel(tokens: string[]): string | null {
  if (tokens.length < 2) return null;
  return tokens.slice(1, 3).join(' ');
}

function computeMatchScore(aTokens: string[], bTokens: string[]): number {
  const similarity = tokenSimilarity(aTokens, bTokens);
  const brandA = extractBrand(aTokens);
  const brandB = extractBrand(bTokens);
  const modelA = extractModel(aTokens);
  const modelB = extractModel(bTokens);
  const brandScore = brandA && brandB && brandA === brandB ? 0.15 : 0;
  const modelScore = modelA && modelB && modelA === modelB ? 0.1 : 0;
  return Math.min(1, similarity * 0.75 + brandScore + modelScore);
}

function computeConfidence(score: number, profitPct: number, distanceKm: number | null) {
  let adjusted = score;
  if (profitPct >= 25) adjusted += 0.1;
  if (distanceKm !== null) {
    adjusted += distanceKm <= 25 ? 0.05 : -0.05;
  }
  adjusted = Math.max(0, Math.min(1, adjusted));
  const label = adjusted >= 0.7 ? 'HIGH' : adjusted >= 0.45 ? 'MED' : 'LOW';
  return { score: adjusted, label };
}

function parsePrice(value: any): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickField(item: any, keys: string[]): string {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => {
      if (!acc || typeof acc !== 'object') return undefined;
      return acc[part];
    }, item);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function pickNumber(item: any, keys: string[]): number | null {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => {
      if (!acc || typeof acc !== 'object') return undefined;
      return acc[part];
    }, item);
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toCandidates(results: any[], market: MarketplaceId, geo: ArbitrageRule['geo']) {
  const candidates: MatchCandidate[] = [];
  for (const result of results) {
    for (const item of result.items ?? []) {
      const title =
        pickField(item, [
          'title',
          'name',
          'listingTitle',
          'heading',
          'marketplace_listing_title',
        ]) || 'Listing';
      const price =
        parsePrice(
          pickField(item, [
            'price',
            'priceLabel',
            'listingPrice',
            'priceValue',
            'amount',
          ]),
        ) ?? null;
      const url =
        pickField(item, [
          'url',
          'listingUrl',
          'itemUrl',
          'link',
          'productUrl',
          'permalink',
        ]) || '';
      const lat = pickNumber(item, ['location.lat', 'lat', 'latitude']);
      const lng = pickNumber(item, ['location.lng', 'lng', 'longitude']);
      if (geo?.lat && geo?.lng && geo?.radiusKm && lat !== null && lng !== null) {
        const distance = haversineKm(
          { lat: geo.lat, lng: geo.lng },
          { lat, lng },
        );
        if (distance > geo.radiusKm) {
          continue;
        }
      }
      candidates.push({
        market,
        query: result.query ?? '',
        title,
        price,
        url,
        lat,
        lng,
        raw: item,
      });
    }
  }
  return candidates;
}

function buildMatchItem(candidate: MatchCandidate) {
  return {
    marketplace: candidate.market,
    title: candidate.title,
    price: candidate.price,
    url: candidate.url,
    location: {
      lat: candidate.lat,
      lng: candidate.lng,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await requireUserFromJWT(req.headers.authorization);
  if (!user.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const body = parseBody(req);
  const supabase = getServiceSupabaseClient();
  const policy = getTierPolicy(user.tier);
  const cuCap = ARBITRAGE_CU_CAPS[user.tier] ?? ARBITRAGE_CU_CAPS.free;

  const ruleId = typeof body.rule_id === 'string' ? body.rule_id : null;
  let rules: ArbitrageRule[] = [];

  if (ruleId) {
    const { data } = await supabase
      .from('arbitrage_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('user_id', user.userId)
      .maybeSingle();
    if (!data) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    rules = [data as ArbitrageRule];
  } else {
    const { data } = await supabase
      .from('arbitrage_rules')
      .select('*')
      .eq('user_id', user.userId)
      .eq('enabled', true);
    rules = (data ?? []) as ArbitrageRule[];
  }

  if (rules.length === 0) {
    res.status(200).json({ runs: [], matches: [] });
    return;
  }

  const runResults: Array<{ ruleId: string; runId: string; status: string }> = [];
  const allMatches: any[] = [];

  for (const rule of rules) {
    if (!rule.enabled) {
      continue;
    }

    const buyMarket = rule.buy_market.toLowerCase() as MarketplaceId;
    const sellMarket = rule.sell_market.toLowerCase() as MarketplaceId;
    if (
      !(buyMarket in MARKETPLACES) ||
      !(sellMarket in MARKETPLACES) ||
      !MARKETPLACES[buyMarket].enabled ||
      !MARKETPLACES[sellMarket].enabled
    ) {
      continue;
    }

    if (!policy.marketsAllowed.includes(buyMarket) || !policy.marketsAllowed.includes(sellMarket)) {
      continue;
    }

    const queries = (rule.queries ?? []).slice(0, policy.maxQueriesPerRun);
    if (queries.length === 0) {
      continue;
    }

    const { data: run, error: runError } = await supabase
      .from('arbitrage_runs')
      .insert({
        rule_id: rule.id,
        user_id: rule.user_id,
        status: 'running',
        notes: { message: 'Decision intelligence only; no automation.' },
      })
      .select()
      .single();

    if (runError || !run) {
      continue;
    }

    const searchBody = {
      queries,
      markets: [buyMarket, sellMarket],
      lat: rule.geo?.lat ?? null,
      lng: rule.geo?.lng ?? null,
      radiusKm: rule.geo?.radiusKm ?? null,
      country: rule.geo?.country ?? null,
      limit: 20,
    };

    const searchResult = await executeSearch(
      req,
      searchBody,
      { userId: rule.user_id, tier: user.tier },
      { source: 'auto_arbitrage', cuCap },
    );

    if (searchResult.status !== 200) {
      await supabase
        .from('arbitrage_runs')
        .update({ status: 'error', finished_at: new Date().toISOString() })
        .eq('id', run.id);
      runResults.push({ ruleId: rule.id, runId: run.id, status: 'error' });
      continue;
    }

    const payload = searchResult.payload;
    const results = Array.isArray(payload.results) ? payload.results : [];
    const buyResults = results.filter((entry: any) => entry.market === buyMarket);
    const sellResults = results.filter((entry: any) => entry.market === sellMarket);

    const buyCandidates = toCandidates(buyResults, buyMarket, rule.geo);
    const sellCandidates = toCandidates(sellResults, sellMarket, rule.geo);

    const usedSell = new Set<string>();
    const matches: Array<any> = [];

    for (const buy of buyCandidates) {
      if (buy.price === null) continue;
      const buyTokens = tokenizeTitle(buy.title);
      let best: { sell: MatchCandidate; score: number } | null = null;

      for (const sell of sellCandidates) {
        if (sell.price === null || usedSell.has(sell.url)) continue;
        const sellTokens = tokenizeTitle(sell.title);
        const score = computeMatchScore(buyTokens, sellTokens);
        if (score < 0.45) continue;
        if (!best || score > best.score) {
          best = { sell, score };
        }
      }

      if (!best) continue;
      const sell = best.sell;
      if (sell.price === null) continue;
      const profitAbs = sell.price - buy.price;
      const profitPct = buy.price > 0 ? (profitAbs / buy.price) * 100 : 0;
      if (profitAbs < rule.min_profit_abs || profitPct < rule.min_profit_pct) {
        continue;
      }

      const distanceKm =
        buy.lat !== null && buy.lng !== null && sell.lat !== null && sell.lng !== null
          ? haversineKm({ lat: buy.lat, lng: buy.lng }, { lat: sell.lat, lng: sell.lng })
          : null;
      const confidence = computeConfidence(best.score, profitPct, distanceKm);

      matches.push({
        run_id: run.id,
        item_buy: buildMatchItem(buy),
        item_sell: buildMatchItem(sell),
        buy_price: buy.price,
        sell_price: sell.price,
        profit_abs: profitAbs,
        profit_pct: profitPct,
        confidence_score: confidence.score,
        confidence_label: confidence.label,
      });
      usedSell.add(sell.url);
      if (matches.length >= MAX_MATCHES_PER_RUN) break;
    }

    if (matches.length > 0) {
      const insertPayload = matches.map((match) => ({
        run_id: match.run_id,
        item_buy: match.item_buy,
        item_sell: match.item_sell,
        buy_price: match.buy_price,
        sell_price: match.sell_price,
        profit_abs: match.profit_abs,
        profit_pct: match.profit_pct,
        confidence_score: match.confidence_score,
      }));
      await supabase.from('arbitrage_matches').insert(insertPayload);
    }

    await supabase
      .from('arbitrage_runs')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        cu_spent: payload.meta?.cuEstimated ?? null,
        matches_found: matches.length,
        notes: {
          cuCap,
          warnings: payload.meta?.warnings ?? [],
          message: 'Decision intelligence only; no automation.',
        },
      })
      .eq('id', run.id);

    runResults.push({ ruleId: rule.id, runId: run.id, status: 'completed' });
    allMatches.push(...matches);
  }

  res.status(200).json({
    runs: runResults,
    matches: allMatches.map(({ confidence_label, ...rest }) => rest),
  });
}
