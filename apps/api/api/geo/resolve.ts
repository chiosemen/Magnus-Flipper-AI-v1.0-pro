import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type GeoResolveResponse = {
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
  source: 'provider' | 'cache';
};

type GeoCacheRecord = {
  lat: number;
  lng: number;
  expiresAt: number;
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NOMINATIM_MIN_INTERVAL_MS = 1100;

const memoryCache = new Map<string, GeoCacheRecord>();
let throttleChain: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

function normalizePostalCode(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  const compact = upper.replace(/\s+/g, '');
  if (looksLikeUkPostcode(compact)) {
    return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
  }
  return trimmed;
}

function looksLikeUkPostcode(compact: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact);
}

function looksLikeUsZip(compact: string): boolean {
  return /^\d{5}$/.test(compact);
}

function normalizeCountry(input: string | null | undefined): string | null {
  if (!input) return null;
  const normalized = input.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function resolveCountry(postalCode: string, countryInput?: string): string | null {
  const explicit = normalizeCountry(countryInput);
  if (explicit) return explicit;
  const compact = postalCode.replace(/\s+/g, '').toUpperCase();
  if (looksLikeUkPostcode(compact)) return 'UK';
  if (looksLikeUsZip(compact)) return 'US';
  return null;
}

function getCacheKey(postalCode: string, country: string): string {
  return `${country}:${postalCode}`;
}

function getMemoryCache(postalCode: string, country: string): GeoCacheRecord | null {
  const key = getCacheKey(postalCode, country);
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry;
}

function setMemoryCache(postalCode: string, country: string, lat: number, lng: number) {
  const key = getCacheKey(postalCode, country);
  memoryCache.set(key, {
    lat,
    lng,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function readSupabaseCache(postalCode: string, country: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('geo_cache')
    .select('lat, lng')
    .eq('postal_code', postalCode)
    .eq('country', country)
    .maybeSingle();

  if (error || !data) return null;
  if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return null;
  return { lat: data.lat, lng: data.lng };
}

async function writeSupabaseCache(postalCode: string, country: string, lat: number, lng: number) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase
    .from('geo_cache')
    .upsert(
      {
        postal_code: postalCode,
        country,
        lat,
        lng,
      },
      { onConflict: 'postal_code,country' },
    );
}

async function throttleNominatim() {
  throttleChain = throttleChain.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, NOMINATIM_MIN_INTERVAL_MS - (now - lastRequestAt));
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastRequestAt = Date.now();
  });
  return throttleChain;
}

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

function runNormalizePostalCodeSelfTest() {
  const cases: Array<{ input: string; expected: string }> = [
    { input: ' sw1a  1aa ', expected: 'SW1A 1AA' },
    { input: 'EC1A1BB', expected: 'EC1A 1BB' },
    { input: ' 12345 ', expected: '12345' },
  ];

  for (const testCase of cases) {
    const actual = normalizePostalCode(testCase.input);
    if (actual !== testCase.expected) {
      throw new Error(
        `normalizePostalCode failed for "${testCase.input}": expected "${testCase.expected}", got "${actual}"`,
      );
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  runNormalizePostalCodeSelfTest();
}

async function resolveWithNominatim(
  postalCode: string,
  country: string,
  userAgent: string,
): Promise<{ lat: number; lng: number }> {
  const countryCode =
    country === 'UK' ? 'gb' : country === 'US' ? 'us' : country.toLowerCase();

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('postalcode', postalCode);
  if (countryCode) {
    url.searchParams.set('countrycodes', countryCode);
  }

  await throttleNominatim();

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': userAgent,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geo provider failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Array<{ lat: string; lon: string }>;
  const first = payload?.[0];
  if (!first) {
    throw new Error('Postal code not found');
  }

  const lat = Number.parseFloat(first.lat);
  const lng = Number.parseFloat(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Invalid coordinates returned by provider');
  }

  return { lat, lng };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userAgent = process.env.GEO_RESOLVE_USER_AGENT;
  if (!userAgent) {
    res.status(500).json({
      error: 'GEO_RESOLVE_USER_AGENT is required to resolve postal codes.',
    });
    return;
  }

  const provider = process.env.GEO_RESOLVE_PROVIDER ?? 'nominatim';
  if (provider !== 'nominatim') {
    res.status(500).json({ error: 'Unsupported GEO_RESOLVE_PROVIDER' });
    return;
  }

  const body = parseBody(req);
  const rawPostal = typeof body.postalCode === 'string' ? body.postalCode : '';
  const normalizedPostal = normalizePostalCode(rawPostal);

  if (!normalizedPostal) {
    res.status(400).json({ error: 'postalCode is required' });
    return;
  }

  const country = resolveCountry(normalizedPostal, body.country);
  if (!country) {
    res.status(400).json({ error: 'country is required for this postal code' });
    return;
  }

  const cachedMemory = getMemoryCache(normalizedPostal, country);
  if (cachedMemory) {
    res.status(200).json({
      postalCode: normalizedPostal,
      country,
      lat: cachedMemory.lat,
      lng: cachedMemory.lng,
      source: 'cache',
    } satisfies GeoResolveResponse);
    return;
  }

  const cachedSupabase = await readSupabaseCache(normalizedPostal, country);
  if (cachedSupabase) {
    setMemoryCache(normalizedPostal, country, cachedSupabase.lat, cachedSupabase.lng);
    res.status(200).json({
      postalCode: normalizedPostal,
      country,
      lat: cachedSupabase.lat,
      lng: cachedSupabase.lng,
      source: 'cache',
    } satisfies GeoResolveResponse);
    return;
  }

  try {
    const { lat, lng } = await resolveWithNominatim(normalizedPostal, country, userAgent);
    setMemoryCache(normalizedPostal, country, lat, lng);
    await writeSupabaseCache(normalizedPostal, country, lat, lng);

    res.status(200).json({
      postalCode: normalizedPostal,
      country,
      lat,
      lng,
      source: 'provider',
    } satisfies GeoResolveResponse);
  } catch (error: any) {
    res.status(502).json({ error: error?.message || 'Geo lookup failed' });
  }
}
