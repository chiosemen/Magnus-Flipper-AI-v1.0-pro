import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { getServiceSupabaseClient } from '../../lib/supabase';
import { getTierPolicy } from '../../lib/tierPolicy';
import { getUserTier } from '../../lib/auth';
import {
  extractPrice,
  extractResaleAnchor,
  median,
  scoreDeal,
  type Listing,
} from '../../lib/dealScore';
import { geohashEncode, getGeohashPrecision } from '../../lib/geopool';

type SearchResultPayload = {
  market: string;
  query: string;
  items: any[];
  locationUsed?: {
    text?: string | null;
    lat?: number | null;
    lng?: number | null;
    country?: string | null;
  } | null;
  radiusKmUsed?: number | null;
  timestamp?: string | null;
  pooling?: {
    geoKey?: string | null;
  } | null;
};

type AggregateBody = {
  userId?: string | null;
  results?: SearchResultPayload[];
};

function parseBody(req: VercelRequest): AggregateBody {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as AggregateBody;
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') {
    return req.body as AggregateBody;
  }
  return {};
}

function getAdminHeader(req: VercelRequest) {
  const header = req.headers['x-admin-key'];
  if (Array.isArray(header)) return header[0];
  return header;
}

function pickField(item: any, keys: string[]): string | null {
  if (!item || typeof item !== 'object') return null;
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => {
      if (!acc || typeof acc !== 'object') return undefined;
      return acc[part];
    }, item as Record<string, any>);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function getItemLatLng(item: any): { lat: number; lng: number } | null {
  if (!item || typeof item !== 'object') return null;
  const candidates = [
    { lat: item.lat, lng: item.lng },
    { lat: item.latitude, lng: item.longitude },
    { lat: item.location?.lat, lng: item.location?.lng },
    { lat: item.location?.latitude, lng: item.location?.longitude },
    { lat: item.geo?.lat, lng: item.geo?.lng },
  ];
  for (const candidate of candidates) {
    if (
      typeof candidate.lat === 'number' &&
      Number.isFinite(candidate.lat) &&
      typeof candidate.lng === 'number' &&
      Number.isFinite(candidate.lng)
    ) {
      return { lat: candidate.lat, lng: candidate.lng };
    }
  }
  return null;
}

function normalizeGeoToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function resolveGeoCell(result: SearchResultPayload) {
  if (result.pooling?.geoKey) return result.pooling.geoKey;
  const lat = result.locationUsed?.lat ?? null;
  const lng = result.locationUsed?.lng ?? null;
  if (typeof lat === 'number' && typeof lng === 'number') {
    const precision = result.radiusKmUsed
      ? getGeohashPrecision(result.radiusKmUsed) ?? 4
      : 5;
    return geohashEncode(lat, lng, precision);
  }
  const country = result.locationUsed?.country;
  if (country) return `country:${normalizeGeoToken(country)}`;
  const city = result.locationUsed?.text;
  if (city) return `city:${normalizeGeoToken(city)}`;
  return 'global';
}

function hashTitle(title: string) {
  return createHash('sha256').update(title.trim().toLowerCase()).digest('hex');
}

function percentile(values: number[], percentileValue: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * percentileValue)),
  );
  return sorted[index] ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const adminKey = getAdminHeader(req);
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = parseBody(req);
  const results = Array.isArray(body.results) ? body.results : [];
  if (results.length === 0) {
    res.status(400).json({ error: 'results array required' });
    return;
  }

  try {
    const supabase = getServiceSupabaseClient();
    const statDate = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    const listings: Array<
      Listing & {
        geoCell: string;
        market: string;
        query: string;
        titleHash: string;
        priceNumber: number | null;
        url?: string;
        resaleAnchor: number | null;
      }
    > = [];

    for (const result of results) {
      if (!result || !Array.isArray(result.items)) continue;
      const geoCell = resolveGeoCell(result);
      for (const item of result.items) {
        const title =
          pickField(item, [
            'title',
            'name',
            'listingTitle',
            'heading',
            'marketplace_listing_title',
          ]) || 'Listing';
        const url =
          pickField(item, [
            'url',
            'listingUrl',
            'itemUrl',
            'link',
            'productUrl',
            'permalink',
          ]) || undefined;
        const image =
          pickField(item, ['image', 'imageUrl', 'picture', 'photo', 'thumbnail']) || undefined;
        const postedAt =
          pickField(item, [
            'createdAt',
            'created_at',
            'listedAt',
            'timestamp',
            'date',
            'publishedAt',
          ]) || undefined;
        const itemLatLng = getItemLatLng(item);
        const priceNumber = extractPrice(item);
        const resaleAnchor = extractResaleAnchor(item);

        listings.push({
          market: result.market,
          query: result.query,
          title,
          price: priceNumber ?? item?.price ?? null,
          currency: item?.currency,
          url,
          image,
          locationText: result.locationUsed?.text ?? undefined,
          lat: itemLatLng?.lat ?? undefined,
          lng: itemLatLng?.lng ?? undefined,
          radiusKm: result.radiusKmUsed ?? undefined,
          postedAt,
          fetchedAt: result.timestamp ?? nowIso,
          geoCell,
          titleHash: hashTitle(title),
          priceNumber,
          resaleAnchor,
        });
      }
    }

    if (listings.length === 0) {
      res.status(200).json({ ok: true, message: 'No listings to aggregate' });
      return;
    }

    const grouped = new Map<
      string,
      { market: string; query: string; geoCell: string; prices: number[]; count: number }
    >();

    for (const listing of listings) {
      const key = `${listing.market}|${listing.query}|${listing.geoCell}`;
      const group = grouped.get(key) ?? {
        market: listing.market,
        query: listing.query,
        geoCell: listing.geoCell,
        prices: [],
        count: 0,
      };
      if (listing.priceNumber !== null) {
        group.prices.push(listing.priceNumber);
      }
      group.count += 1;
      grouped.set(key, group);
    }

    const statsRows = Array.from(grouped.values()).map((group) => ({
      market: group.market,
      query: group.query,
      geo_cell: group.geoCell,
      stat_date: statDate,
      median_price: median(group.prices),
      count_listings: group.count,
      updated_at: nowIso,
    }));

    await supabase.from('listing_stats_daily').upsert(statsRows, {
      onConflict: 'market,query,geo_cell,stat_date',
    });

    const priceDistributionRows = Array.from(grouped.values()).map((group) => ({
      market: group.market,
      query: group.query,
      geo_cell: group.geoCell,
      stat_date: statDate,
      p10: percentile(group.prices, 0.1),
      p50: percentile(group.prices, 0.5),
      p90: percentile(group.prices, 0.9),
      sample_count: group.prices.length,
      updated_at: nowIso,
    }));

    const { error: marketStatsError } = await supabase
      .from('market_stats_daily')
      .upsert(statsRows, {
        onConflict: 'market,query,geo_cell,stat_date',
      });
    if (marketStatsError) {
      // Phase 9 tables may not exist yet; ignore to keep aggregation running.
    }

    const { error: distributionError } = await supabase
      .from('price_distributions')
      .upsert(priceDistributionRows, {
        onConflict: 'market,query,geo_cell,stat_date',
      });
    if (distributionError) {
      // Phase 9 tables may not exist yet; ignore to keep aggregation running.
    }

    const listingRows = listings.slice(0, 200).map((listing) => ({
      market: listing.market,
      query: listing.query,
      title: listing.title,
      price: listing.priceNumber,
      currency: listing.currency ?? null,
      url: listing.url ?? null,
      image: listing.image ?? null,
      location_text: listing.locationText ?? null,
      lat: listing.lat ?? null,
      lng: listing.lng ?? null,
      radius_km: listing.radiusKm ?? null,
      geo_cell: listing.geoCell,
      posted_at: listing.postedAt ?? null,
      fetched_at: listing.fetchedAt,
      created_at: nowIso,
    }));

    await supabase.from('listings_normalized').insert(listingRows);

    const dealScoreRows = listings.slice(0, 200).map((listing) => {
      const key = `${listing.market}|${listing.query}|${listing.geoCell}`;
      const group = grouped.get(key);
      const contextMedian = group ? median(group.prices) : null;
      const contextCount = group ? group.count : null;
      const dealScore = scoreDeal({
        listing,
        marketContext: {
          medianPrice: contextMedian,
          listingCount: contextCount,
          referencePrice: listing.resaleAnchor,
        },
        geoContext: {
          hasExactLocation:
            typeof listing.lat === 'number' &&
            typeof listing.lng === 'number',
          hasRadius: typeof listing.radiusKm === 'number',
        },
      });

      return {
        user_id: body.userId ?? null,
        market: listing.market,
        query: listing.query,
        score: dealScore.score,
        confidence: dealScore.confidence,
        signals: dealScore.signals,
        explanation: dealScore.explanation,
        listing: {
          title: listing.title,
          price: listing.price,
          url: listing.url,
          image: listing.image,
          market: listing.market,
          query: listing.query,
          locationText: listing.locationText,
          geoCell: listing.geoCell,
        },
        created_at: nowIso,
      };
    });

    const { error: dealScoreError } = await supabase
      .from('deal_scores')
      .insert(dealScoreRows);
    if (dealScoreError) {
      // Phase 9 tables may not exist yet; ignore to keep aggregation running.
    }

    if (body.userId) {
      const tier = await getUserTier(supabase, body.userId);
      const policy = getTierPolicy(tier);

      if (policy.features.signals) {
        const signalRows = listings
          .map((listing) => {
            const key = `${listing.market}|${listing.query}|${listing.geoCell}`;
            const group = grouped.get(key);
            const contextMedian = group ? median(group.prices) : null;
            const contextCount = group ? group.count : null;

            const dealScore = scoreDeal({
              listing,
              marketContext: {
                medianPrice: contextMedian,
                listingCount: contextCount,
                referencePrice: listing.resaleAnchor,
              },
              geoContext: {
                hasExactLocation:
                  typeof listing.lat === 'number' &&
                  typeof listing.lng === 'number',
                hasRadius: typeof listing.radiusKm === 'number',
              },
            });

            if (dealScore.score < 75) return null;
            return {
              user_id: body.userId,
              market: listing.market,
              query: listing.query,
              score: dealScore.score,
              confidence: dealScore.confidence,
              explanation: dealScore.explanation,
              warnings: [],
              listing: {
                title: listing.title,
                price: listing.price,
                url: listing.url,
                image: listing.image,
                market: listing.market,
                query: listing.query,
                locationText: listing.locationText,
                geoCell: listing.geoCell,
              },
              created_at: nowIso,
            };
          })
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
          .slice(0, 50);

        if (signalRows.length > 0) {
          await supabase.from('deal_signals').insert(signalRows);
        }
      }
    }

    res.status(200).json({
      ok: true,
      listingsProcessed: listings.length,
      statsUpdated: statsRows.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Aggregation failed' });
  }
}
