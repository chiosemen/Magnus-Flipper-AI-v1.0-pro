import type { VercelRequest, VercelResponse } from '@vercel/node';
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
  title: string;
  price: string | number | null;
  url: string;
};

const MAX_EMAIL_ITEMS = 10;

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

function collectListings(results: Array<any>): ListingItem[] {
  const listings: ListingItem[] = [];
  for (const result of results) {
    const marketplace = result.market ?? 'unknown';
    for (const item of result.items ?? []) {
      const url = pickField(item, [
        'url',
        'listingUrl',
        'itemUrl',
        'link',
        'productUrl',
        'permalink',
      ]);
      if (!url) continue;
      const title =
        pickField(item, [
          'title',
          'name',
          'listingTitle',
          'heading',
          'marketplace_listing_title',
        ]) || 'Listing';
      const price = parsePrice(
        pickField(item, [
          'price',
          'priceLabel',
          'listingPrice',
          'priceValue',
          'amount',
        ]),
      );
      listings.push({ marketplace, title, price, url });
    }
  }
  return listings;
}

function buildGeoSummary(geo: SavedSearchRecord['geo']) {
  if (!geo) return 'n/a';
  const parts: string[] = [];
  if (geo.country) parts.push(geo.country);
  if (geo.locationText) parts.push(geo.locationText);
  if (geo.postal) parts.push(geo.postal);
  if (geo.lat !== null && geo.lat !== undefined && geo.lng !== null && geo.lng !== undefined) {
    parts.push(`${geo.lat},${geo.lng}`);
  }
  if (geo.radiusKm) {
    parts.push(`${geo.radiusKm}${geo.units === 'mi' ? ' mi' : ' km'}`);
  }
  return parts.length > 0 ? parts.join(' - ') : 'n/a';
}

function buildEmailHtml(
  search: SavedSearchRecord,
  newItems: ListingItem[],
) {
  const rows = newItems.slice(0, MAX_EMAIL_ITEMS).map((item) => {
    const price = item.price ?? 'n/a';
    return `
      <tr>
        <td style="padding:6px 0;color:#e5e7eb;">${item.marketplace}</td>
        <td style="padding:6px 0;color:#e5e7eb;">${item.title}</td>
        <td style="padding:6px 0;color:#e5e7eb;">${price}</td>
        <td style="padding:6px 0;">
          <a href="${item.url}" style="color:#60a5fa;text-decoration:none;">View</a>
        </td>
      </tr>
    `;
  });

  return `
    <div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#e5e7eb;padding:24px;">
      <h2 style="margin:0 0 8px;">${search.name} - New listings</h2>
      <p style="margin:0 0 12px;color:#9ca3af;">
        Markets: ${(search.markets ?? []).join(', ')} | Geo: ${buildGeoSummary(search.geo)}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left" style="padding-bottom:8px;color:#9ca3af;">Market</th>
            <th align="left" style="padding-bottom:8px;color:#9ca3af;">Title</th>
            <th align="left" style="padding-bottom:8px;color:#9ca3af;">Price</th>
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
      .select('started_at')
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
    const uniqueUrls = Array.from(new Set(listings.map((item) => item.url)));

    const { data: seenRows } = await supabase
      .from('listing_seen')
      .select('listing_url')
      .eq('user_id', search.user_id)
      .eq('saved_search_id', search.id)
      .in('listing_url', uniqueUrls);

    const seenSet = new Set((seenRows ?? []).map((row) => row.listing_url));
    const newItems = listings.filter((item) => !seenSet.has(item.url));

    if (newItems.length > 0) {
      const seenInsert = newItems.map((item) => ({
        user_id: search.user_id,
        saved_search_id: search.id,
        marketplace: item.marketplace,
        listing_url: item.url,
      }));
      await supabase.from('listing_seen').upsert(seenInsert, {
        onConflict: 'user_id,saved_search_id,marketplace,listing_url',
        ignoreDuplicates: true,
      });
    }

    let sent = 0;
    let emailStatus: string | null = null;

    if (newItems.length > 0) {
      const { data: user } = await supabase.auth.admin.getUserById(search.user_id);
      const email = user?.user?.email;
      if (email) {
        const html = buildEmailHtml(search, newItems);
        const emailResult = await sendEmail({
          to: email,
          subject: `${search.name}: ${newItems.length} new listings`,
          html,
        });
        if (emailResult.ok) {
          sent = Math.min(newItems.length, MAX_EMAIL_ITEMS);
          emailStatus = 'sent';
        } else {
          emailStatus = emailResult.skipped ? 'skipped' : 'failed';
        }
      } else {
        emailStatus = 'no_email';
      }
    }

    await supabase
      .from('alert_runs')
      .update({
        status: 'complete',
        finished_at: new Date().toISOString(),
        matches_found: newItems.length,
        meta: {
          emailStatus,
          totalListings: listings.length,
          newListings: newItems.length,
          cuEstimated: payload.meta?.cuEstimated ?? null,
          warnings: payload.meta?.warnings ?? [],
        },
      })
      .eq('id', run.id);

    results.push({ id: search.id, status: 'complete', sent });
  }

  res.status(200).json({ results });
}
