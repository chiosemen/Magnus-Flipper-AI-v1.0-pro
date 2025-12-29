import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type GeoCacheEntry = {
  lat: number;
  lng: number;
  updatedAt: number;
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PROVIDER_INTERVAL_MS = 1200;
const memoryCache = new Map<string, GeoCacheEntry>();
let lastProviderAt = 0;
let providerChain: Promise<void> = Promise.resolve();

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

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatUkPostcode(compact: string): string {
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function normalizePostalCode(
  raw: string,
  country?: string | null,
): { postalCode: string; country: string } | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;

  const normalizedCountry = country ? country.trim().toUpperCase() : null;
  const compact = trimmed.replace(/\s+/g, '').toUpperCase();
  const isUk = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact);
  const isUs = /^\d{5}(-\d{4})?$/.test(trimmed);

  let inferredCountry = normalizedCountry;
  if (!inferredCountry) {
    if (isUk) inferredCountry = 'UK';
    else if (isUs) inferredCountry = 'US';
  }
  if (!inferredCountry) return null;

  let postalCode = trimmed;
  if (isUk) {
    postalCode = formatUkPostcode(compact);
  } else {
    postalCode = trimmed.toUpperCase();
  }

  return { postalCode, country: inferredCountry };
}

function runNormalizationSelfTest() {
  const cases = [
    { input: 'sw1a1aa', expectedPostal: 'SW1A 1AA', expectedCountry: 'UK' },
    { input: 'EC1A 1BB', expectedPostal: 'EC1A 1BB', expectedCountry: 'UK' },
    { input: '90210', expectedPostal: '90210', expectedCountry: 'US' },
  ];

  for (const test of cases) {
    const result = normalizePostalCode(test.input);
    if (
      !result ||
      result.postalCode !== test.expectedPostal ||
      result.country !== test.expectedCountry
    ) {
      console.warn('[geo] normalizePostalCode test failed', test, result);
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  runNormalizationSelfTest();
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isFresh(updatedAt: number) {
  return Date.now() - updatedAt < CACHE_TTL_MS;
}

async function readCacheFromSupabase(
  postalCode: string,
  country: string,
): Promise<GeoCacheEntry | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('geo_cache')
      .select('lat,lng,updated_at')
      .eq('postal_code', postalCode)
      .eq('country', country)
      .maybeSingle();
    if (error || !data) return null;
    const updatedAt = Date.parse(data.updated_at);
    if (!Number.isFinite(updatedAt)) return null;
    return {
      lat: Number(data.lat),
      lng: Number(data.lng),
      updatedAt,
    };
  } catch {
    return null;
  }
}

async function writeCacheToSupabase(
  postalCode: string,
  country: string,
  lat: number,
  lng: number,
) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('geo_cache').upsert({
      postal_code: postalCode,
      country,
      lat,
      lng,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Best-effort cache.
  }
}

async function runWithProviderThrottle<T>(task: () => Promise<T>): Promise<T> {
  const result = providerChain.then(async () => {
    const now = Date.now();
    const waitMs = Math.max(0, PROVIDER_INTERVAL_MS - (now - lastProviderAt));
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    lastProviderAt = Date.now();
    return task();
  });

  providerChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function resolveCountryCode(country: string): string | null {
  const normalized = country.toLowerCase();
  if (normalized === 'uk' || normalized === 'gb') return 'gb';
  if (normalized === 'us' || normalized === 'usa') return 'us';
  return null;
}

async function fetchFromProvider(
  postalCode: string,
  country: string,
  userAgent: string,
): Promise<{ lat: number; lng: number } | null> {
  const provider = (process.env.GEO_RESOLVE_PROVIDER || 'nominatim').toLowerCase();
  if (provider !== 'nominatim') {
    throw new Error(`Unsupported GEO_RESOLVE_PROVIDER: ${provider}`);
  }

  return runWithProviderThrottle(async () => {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('postalcode', postalCode);
    const countryCode = resolveCountryCode(country);
    if (countryCode) {
      url.searchParams.set('countrycodes', countryCode);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Provider error (${response.status})`);
    }
    const payload = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(payload) || payload.length === 0) {
      return null;
    }
    const lat = Number.parseFloat(payload[0].lat);
    const lng = Number.parseFloat(payload[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat, lng };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const userAgent = process.env.GEO_RESOLVE_USER_AGENT;
  if (!userAgent) {
    res.status(500).json({ error: 'GEO_RESOLVE_USER_AGENT missing' });
    return;
  }

  const body = parseBody(req);
  const rawPostal = normalizeString(body.postalCode);
  if (!rawPostal) {
    res.status(400).json({ error: 'postalCode required' });
    return;
  }

  const normalized = normalizePostalCode(rawPostal, normalizeString(body.country));
  if (!normalized) {
    res.status(400).json({ error: 'Country required for this postal code' });
    return;
  }

  const { postalCode, country } = normalized;
  const cacheKey = `${postalCode}|${country}`;

  const cachedFromDb = await readCacheFromSupabase(postalCode, country);
  if (cachedFromDb && isFresh(cachedFromDb.updatedAt)) {
    res.status(200).json({
      postalCode,
      country,
      lat: cachedFromDb.lat,
      lng: cachedFromDb.lng,
      source: 'cache',
    });
    return;
  }

  const cachedFromMemory = memoryCache.get(cacheKey);
  if (cachedFromMemory && isFresh(cachedFromMemory.updatedAt)) {
    res.status(200).json({
      postalCode,
      country,
      lat: cachedFromMemory.lat,
      lng: cachedFromMemory.lng,
      source: 'cache',
    });
    return;
  }

  try {
    const resolved = await fetchFromProvider(postalCode, country, userAgent);
    if (!resolved) {
      res.status(404).json({ error: 'Postal code not found' });
      return;
    }

    memoryCache.set(cacheKey, {
      lat: resolved.lat,
      lng: resolved.lng,
      updatedAt: Date.now(),
    });
    await writeCacheToSupabase(postalCode, country, resolved.lat, resolved.lng);

    res.status(200).json({
      postalCode,
      country,
      lat: resolved.lat,
      lng: resolved.lng,
      source: 'provider',
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Geo resolution failed' });
  }
}
