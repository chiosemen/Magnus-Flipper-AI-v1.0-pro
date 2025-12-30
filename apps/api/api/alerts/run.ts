import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { executeSearch } from '../search';
import { getServiceSupabaseClient } from '../../lib/supabase';
import { getUserTier } from '../../lib/auth';
import { getTierPolicy } from '../../lib/tierPolicy';
import { MARKETPLACES, type MarketplaceId } from '../../lib/marketplaceRegistry';
import { sendEmail } from '../../lib/email';

type SavedSearchRecord = {
  id: string;
  user_id: string;
  name: string;
  queries: string[];
  markets: string[];
  geo: {
    country?: string | null;
    locationText?: string | null;
    postal?: string | null;
    lat?: number | null;
    lng?: number | null;
    radiusKm?: number | null;
    units?: 'km' | 'mi' | null;
  } | null;
  frequency: 'daily' | 'weekly';
  enabled: boolean;
};

type ListingItem = {
  marketplace: string;
  query: string;
  title: string;
  price: string | number | null;
  priceNumber: number | null;
  url: string;
  titleHash: string | null;
  dedupeKeys: string[];
};

type AlertItem = ListingItem & {
  changeType: 'new_listing' | 'price_drop';
  previousPrice?: number | null;
};

const MAX_EMAIL_ITEMS = 10;
const DEFAULT_PRICE_DROP_PCT = 0.08;

function getAdminHeader(req: VercelRequest) {
  const header = req.headers['x-admin-key'];
  if (Array.isArray(header)) return header[0];
  return header;
}

function shouldRun(frequency: 'daily' | 'weekly', lastRunAt: string | null) {
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt).getTime();
  const now = Date.now();
  const threshold = frequency === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return now - last >= threshold;
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

function parsePrice(value: any): string | number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

function parsePriceNumber(value: any): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (!cleaned) return null;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getPreviousPrice(map: Record<string, any>, key: string): number | null {
  const value = map[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    return parsePriceNumber(value);
  }
  return null;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hashTitle(title: string): string {
  return createHash('sha256').update(normalizeText(title)).digest('hex');
}

function buildDedupeKeys(params: {
  url: string | null;
  titleHash: string | null;
  marketplace: string;
  query: string;
}) {
  const keys = new Set<string>();
  if (params.url) {
    keys.add(`url:${params.marketplace}:${params.url}`);
  }
  if (params.titleHash) {
    const queryKey = normalizeText(params.query || '');
    keys.add(`mq:${params.marketplace}:${queryKey}:${params.titleHash}`);
  }
  return Array.from(keys);
}

function collectListings(results: Array<any>): ListingItem[] {
  const listings: ListingItem[] = [];
  for (const result of results) {
    const marketplace = result.market ?? 'unknown';
    const query = typeof result.query === 'string' ? result.query : '';
    for (const item of result.items ?? []) {
      const url =
        pickField(item, [
          'url',
          'listingUrl',
          'itemUrl',
          'link',
          'productUrl',
          'permalink',
        ]) || '';
      const title =
        pickField(item, [
          'title',
          'name',
          'listingTitle',
          'heading',
          'marketplace_listing_title',
        ]) || 'Listing';
      const priceValue = pickField(item, [
        'price',
        'priceLabel',
        'listingPrice',
        'priceValue',
        'amount',
      ]);
      const price = parsePrice(priceValue);
      const priceNumber = parsePriceNumber(priceValue);
      const titleHash = title ? hashTitle(title) : null;
      const dedupeKeys = buildDedupeKeys({
        url: url || null,
        titleHash,
        marketplace,
        query,
      });
      if (dedupeKeys.length === 0) continue;
      listings.push({
        marketplace,
        query,
        title,
        price,
        priceNumber,
        url,
        titleHash,
        dedupeKeys,
      });
    }
  }
  return listings;
}

function buildGeoSummary(geo: SavedSearchRecord['geo']) {
  if (!geo) return 'n/a';
  const parts: string[] = [];
  if (geo.locationText) parts.push(geo.locationText);
  if (geo.postal) parts.push(geo.postal);
  if (
    geo.lat !== null &&
    geo.lat !== undefined &&
    geo.lng !== null &&
    geo.lng !== undefined
  ) {
    parts.push(`${geo.lat.toFixed(2)},${geo.lng.toFixed(2)}`);
  }
  if (geo.country) parts.push(geo.country);
  if (geo.radiusKm) {
    const unit = geo.units === 'mi' ? 'mi' : 'km';
    const radius =
      unit === 'mi' ? geo.radiusKm * 0.621371 : geo.radiusKm;
    parts.push(`${radius.toFixed(0)} ${unit}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'n/a';
}

function buildEmailSubject(search: SavedSearchRecord, items: AlertItem[]) {
  const primaryQuery = search.queries?.[0] ?? search.name;
  const markets = (search.markets ?? []).map(
    (market) => MARKETPLACES[market as MarketplaceId]?.label ?? market,
  );
  const marketLabel =
    markets.length === 1 ? markets[0] : `${markets.length} markets`;
  const geoLabel = buildGeoSummary(search.geo);
  const count = items.length;
  const changeLabel =
    items.some((item) => item.changeType === 'price_drop') && count > 0
      ? 'updates'
      : 'new listings';
  const geoSuffix = geoLabel !== 'n/a' ? ` within ${geoLabel}` : '';
  return `${count} ${changeLabel} for "${primaryQuery}" on ${marketLabel}${geoSuffix}`;
}

function buildEmailHtml(search: SavedSearchRecord, items: AlertItem[]) {
  const rows = items.slice(0, MAX_EMAIL_ITEMS).map((item) => {
    const price = item.price ?? 'n/a';
    const changeLabel =
      item.changeType === 'price_drop'
        ? 'Price drop'
        : 'New listing';
    const previous =
      item.changeType === 'price_drop' && typeof item.previousPrice === 'number'
        ? ` (was ${item.previousPrice})`
        : '';
    const marketLabel =
      MARKETPLACES[item.marketplace as MarketplaceId]?.label ?? item.marketplace;
    return `
      <tr>
        <td style="padding:6px 0;color:#e5e7eb;">${marketLabel}</td>
        <td style="padding:6px 0;color:#e5e7eb;">${item.title}</td>
        <td style="padding:6px 0;color:#e5e7eb;">${price}${previous}</td>
        <td style="padding:6px 0;color:#9ca3af;">${changeLabel}</td>
        <td style="padding:6px 0;">
          <a href="${item.url}" style="color:#60a5fa;text-decoration:none;">View</a>
        </td>
      </tr>
    `;
  });

  const marketsLabel = (search.markets ?? []).join(', ');
  const geoLabel = buildGeoSummary(search.geo);
  const queryLabel = (search.queries ?? []).join(', ');

  return `
    <div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#e5e7eb;padding:24px;">
      <h2 style="margin:0 0 6px;">${search.name}</h2>
      <p style="margin:0 0 12px;color:#9ca3af;">
        You are receiving this alert because "${search.name}" is enabled (${search.frequency} cadence).
      </p>
      <div style="margin:0 0 12px;color:#9ca3af;">
        <strong>What changed:</strong> ${items.length} updates<br/>
        <strong>Queries:</strong> ${queryLabel}<br/>
        <strong>Markets:</strong> ${marketsLabel}<br/>
        <strong>Geo:</strong> ${geoLabel}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left" style="padding-bottom:8px;color:#9ca3af;">Market</th>
            <th align="left" style="padding-bottom:8px;color:#9ca3af;">Title</th>
            <th align="left" style="padding-bottom:8px;color:#9ca3af;">Price</th>
            <th align="left" style="padding-bottom:8px;color:#9ca3af;">Change</th>
            <th align="left" style="padding-bottom:8px;color:#9ca3af;">Link</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    </div>
  `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    res.status(500).json({ error: 'ADMIN_KEY missing' });
    return;
  }

  const headerKey = getAdminHeader(req);
  if (!headerKey || headerKey !== adminKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabase = getServiceSupabaseClient();
  const { data: searches, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('enabled', true);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const results: Array<{ id: string; status: string; sent: number }> = [];

  for (const search of (searches ?? []) as SavedSearchRecord[]) {
    const { data: lastRun } = await supabase
      .from('alert_runs')
      .select('started_at, meta')
      .eq('saved_search_id', search.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!shouldRun(search.frequency, lastRun?.started_at ?? null)) {
      continue;
    }

    const tier = await getUserTier(supabase, search.user_id);
    const policy = getTierPolicy(tier);
    const queries = (search.queries ?? []).slice(0, policy.maxQueriesPerRun);
    let markets = (search.markets ?? [])
      .map((market) => market.toLowerCase())
      .filter((market): market is MarketplaceId => market in MARKETPLACES);
    markets = markets.filter(
      (market) => policy.marketsAllowed.includes(market) && MARKETPLACES[market].enabled,
    );
    markets = markets.slice(0, policy.maxMarketsPerRun);

    if (queries.length === 0 || markets.length === 0) {
      continue;
    }

    const { data: run } = await supabase
      .from('alert_runs')
      .insert({
        user_id: search.user_id,
        saved_search_id: search.id,
        status: 'running',
      })
      .select()
      .single();

    if (!run) {
      results.push({ id: search.id, status: 'failed', sent: 0 });
      continue;
    }

    const geo = search.geo ?? {};
    const searchBody = {
      queries,
      markets,
      locationText: geo.locationText ?? null,
      postalCode: geo.postal ?? null,
      lat: geo.lat ?? null,
      lng: geo.lng ?? null,
      radiusKm: geo.radiusKm ?? null,
      units: geo.units ?? null,
      country: geo.country ?? null,
      limit: 20,
    };

    const searchResult = await executeSearch(
      req,
      searchBody,
      { userId: search.user_id, tier },
      { source: 'alert' },
    );

    if (searchResult.status !== 200) {
      await supabase
        .from('alert_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          matches_found: 0,
          meta: { error: searchResult.payload?.error ?? 'Search failed' },
        })
        .eq('id', run.id);
      results.push({ id: search.id, status: 'failed', sent: 0 });
      continue;
    }

    const payload = searchResult.payload;
    const listings = collectListings(payload.results ?? []);
    const dedupeKeys = Array.from(
      new Set(listings.flatMap((item) => item.dedupeKeys)),
    );

    const seenRows =
      dedupeKeys.length > 0
        ? (
            await supabase
              .from('listing_seen')
              .select('listing_url')
              .eq('user_id', search.user_id)
              .eq('saved_search_id', search.id)
              .in('listing_url', dedupeKeys)
          ).data
        : [];

    const seenSet = new Set((seenRows ?? []).map((row) => row.listing_url));
    const newItems = listings.filter((item) =>
      item.dedupeKeys.every((key) => !seenSet.has(key)),
    );

    const meta = typeof lastRun?.meta === 'object' && lastRun?.meta ? lastRun.meta : {};
    const previousPriceMap =
      typeof meta.priceMap === 'object' && meta.priceMap ? meta.priceMap : {};

    const priceThreshold = (() => {
      const raw = Number.parseFloat(process.env.ALERT_PRICE_DROP_PCT ?? '');
      return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_PRICE_DROP_PCT;
    })();

    const priceDropItems = listings.filter((item) => {
      if (!item.priceNumber) return false;
      const primaryKey = item.url
        ? `url:${item.marketplace}:${item.url}`
        : item.dedupeKeys[0];
      const previous = getPreviousPrice(previousPriceMap, primaryKey);
      if (typeof previous !== 'number' || previous <= 0) return false;
      if (item.priceNumber >= previous) return false;
      const deltaPct = (previous - item.priceNumber) / previous;
      return deltaPct >= priceThreshold;
    });

    const hasMinorPriceChanges = listings.some((item) => {
      if (!item.priceNumber) return false;
      const primaryKey = item.url
        ? `url:${item.marketplace}:${item.url}`
        : item.dedupeKeys[0];
      const previous = getPreviousPrice(previousPriceMap, primaryKey);
      if (typeof previous !== 'number' || previous <= 0) return false;
      if (item.priceNumber === previous) return false;
      const deltaPct = Math.abs(previous - item.priceNumber) / previous;
      return deltaPct > 0 && deltaPct < priceThreshold;
    });

    const alertItemsMap = new Map<string, AlertItem>();
    for (const item of newItems) {
      const primaryKey = item.url
        ? `url:${item.marketplace}:${item.url}`
        : item.dedupeKeys[0];
      alertItemsMap.set(primaryKey, { ...item, changeType: 'new_listing' });
    }
    for (const item of priceDropItems) {
      const primaryKey = item.url
        ? `url:${item.marketplace}:${item.url}`
        : item.dedupeKeys[0];
      if (alertItemsMap.has(primaryKey)) continue;
      const previous = getPreviousPrice(previousPriceMap, primaryKey);
      alertItemsMap.set(primaryKey, {
        ...item,
        changeType: 'price_drop',
        previousPrice: typeof previous === 'number' ? previous : null,
      });
    }

    const alertItems = Array.from(alertItemsMap.values());

    if (newItems.length > 0) {
      const seenInsert = newItems.flatMap((item) =>
        item.dedupeKeys.map((key) => ({
          user_id: search.user_id,
          saved_search_id: search.id,
          marketplace: item.marketplace,
          listing_url: key,
        })),
      );
      await supabase.from('listing_seen').upsert(seenInsert, {
        onConflict: 'user_id,saved_search_id,marketplace,listing_url',
        ignoreDuplicates: true,
      });
    }

    let sent = 0;
    let emailStatus: string | null = null;

    const emailItems = alertItems.filter((item) => item.url);

    if (emailItems.length > 0) {
      const { data: user } = await supabase.auth.admin.getUserById(search.user_id);
      const email = user?.user?.email;
      if (email) {
        const html = buildEmailHtml(search, emailItems);
        const emailResult = await sendEmail({
          to: email,
          subject: buildEmailSubject(search, emailItems),
          html,
        });
        if (emailResult.ok) {
          sent = Math.min(emailItems.length, MAX_EMAIL_ITEMS);
          emailStatus = 'sent';
        } else {
          emailStatus = emailResult.skipped ? 'skipped' : 'failed';
        }
      } else {
        emailStatus = 'no_email';
      }
    } else if (alertItems.length > 0) {
      emailStatus = 'no_link';
    }

    const nextPriceMap = listings.reduce<Record<string, number>>((acc, item) => {
      if (typeof item.priceNumber !== 'number') return acc;
      const primaryKey = item.url ? `url:${item.url}` : item.dedupeKeys[0];
      acc[primaryKey] = item.priceNumber;
      return acc;
    }, {});

    const suppressionReason =
      alertItems.length === 0
        ? hasMinorPriceChanges
          ? 'price_changes_below_threshold'
          : 'no_changes'
        : null;

    await supabase
      .from('alert_runs')
      .update({
        status: 'complete',
        finished_at: new Date().toISOString(),
        matches_found: alertItems.length,
        meta: {
          emailStatus,
          totalListings: listings.length,
          newListings: newItems.length,
          priceDrops: priceDropItems.length,
          priceThresholdPct: priceThreshold,
          suppressionReason,
          cuEstimated: payload.meta?.cuEstimated ?? null,
          warnings: payload.meta?.warnings ?? [],
          priceMap: nextPriceMap,
        },
      })
      .eq('id', run.id);

    results.push({ id: search.id, status: 'complete', sent });
  }

  res.status(200).json({ results });
}
