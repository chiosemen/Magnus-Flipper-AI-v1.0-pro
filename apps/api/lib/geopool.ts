import { MARKETPLACES, type MarketplaceId } from './marketplaceRegistry';

type PoolingStrategy = 'geohash' | 'countryOnly' | 'none';

export type PoolRequest = {
  requestId: string;
  userId?: string | null;
  marketplaceId: MarketplaceId;
  query: string;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  tier: string;
  maxResults?: number | null;
  country?: string | null;
  city?: string | null;
};

export type PooledRun = {
  pooledRunId: string;
  marketplaceId: MarketplaceId;
  query: string;
  queryNormalized: string;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  geoKey: string;
  precision: number | null;
  pooling: {
    enabled: boolean;
    strategy: PoolingStrategy;
  };
  requestIds: string[];
  warnings: string[];
};

export type PoolMapping = {
  requestId: string;
  pooledRunId: string;
  marketplaceId: MarketplaceId;
  geoKey: string;
  pooled: boolean;
  warnings: string[];
};

export type PoolPlan = {
  pooledRuns: PooledRun[];
  mapping: PoolMapping[];
};

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function geohashEncode(lat: number, lng: number, precision: number): string {
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let even = true;

  while (hash.length < precision) {
    if (even) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        ch = (ch << 1) + 1;
        lngMin = mid;
      } else {
        ch = (ch << 1) + 0;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch = (ch << 1) + 1;
        latMin = mid;
      } else {
        ch = (ch << 1) + 0;
        latMax = mid;
      }
    }

    even = !even;
    bit += 1;

    if (bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function pickPrecision(radiusKm: number): number {
  if (radiusKm <= 5) return 7;
  if (radiusKm <= 20) return 6;
  if (radiusKm <= 80) return 5;
  if (radiusKm <= 300) return 4;
  return 3;
}

function normalizeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 64);
}

function normalizeCategory(input?: string | null): string | null {
  if (!input) return null;
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized.slice(0, 64) : null;
}

export function planPooledRuns(
  requests: PoolRequest[],
  tierRunCaps: Record<string, number>,
): PoolPlan {
  const pooledRuns: PooledRun[] = [];
  const mapping: PoolMapping[] = [];
  const runByKey = new Map<string, PooledRun>();

  for (const request of requests) {
    const marketplace = MARKETPLACES[request.marketplaceId];
    const warnings: string[] = [];
    if (!marketplace) {
      warnings.push('Marketplace not found.');
      continue;
    }

    const normalizedQuery = normalizeQuery(request.query);
    const normalizedCategory = normalizeCategory(request.category);
    const tierCap = tierRunCaps[request.tier] ?? 1;
    const radiusKm = request.radiusKm ?? 0;
    const precision = pickPrecision(radiusKm);

    let strategy: PoolingStrategy = marketplace.pooling.strategy;
    let poolingEnabled = marketplace.pooling.enabled;

    if (!marketplace.geo.supportsRadius) {
      strategy = marketplace.geo.supportsCountry || marketplace.geo.supportsCity ? 'countryOnly' : 'none';
      warnings.push('Radius disabled for this marketplace.');
    }

    if (request.tier === 'enterprise' && radiusKm > 0 && radiusKm <= 5) {
      strategy = 'none';
      poolingEnabled = false;
      warnings.push('Pooling disabled for enterprise small radius.');
    }

    const geoKeys = buildGeoKeys(
      request,
      strategy,
      precision,
      marketplace.pooling.maxKeysPerRun,
      tierCap,
      warnings,
    );

    for (const geoKey of geoKeys) {
      const key = `${request.marketplaceId}:${geoKey.geoKey}:${normalizedQuery}${
        normalizedCategory ? `:${normalizedCategory}` : ''
      }`;

      let pooledRun = runByKey.get(key);
      if (!pooledRun) {
        pooledRun = {
          pooledRunId: `pool-${pooledRuns.length + 1}`,
          marketplaceId: request.marketplaceId,
          query: request.query,
          queryNormalized: normalizedQuery,
          category: normalizedCategory ?? undefined,
          lat: geoKey.lat ?? request.lat ?? null,
          lng: geoKey.lng ?? request.lng ?? null,
          radiusKm: marketplace.geo.supportsRadius ? request.radiusKm ?? null : null,
          geoKey: geoKey.geoKey,
          precision: strategy === 'geohash' ? precision : null,
          pooling: {
            enabled: poolingEnabled,
            strategy,
          },
          requestIds: [],
          warnings: [...warnings],
        };
        runByKey.set(key, pooledRun);
        pooledRuns.push(pooledRun);
      }

      pooledRun.requestIds.push(request.requestId);
      pooledRun.warnings.push(...warnings);

      mapping.push({
        requestId: request.requestId,
        pooledRunId: pooledRun.pooledRunId,
        marketplaceId: request.marketplaceId,
        geoKey: geoKey.geoKey,
        pooled: pooledRun.requestIds.length > 1,
        warnings,
      });
    }
  }

  return { pooledRuns, mapping };
}

type GeoKeyPoint = { geoKey: string; lat?: number | null; lng?: number | null };

function buildGeoKeys(
  request: PoolRequest,
  strategy: PoolingStrategy,
  precision: number,
  maxKeysPerRun: number,
  tierCap: number,
  warnings: string[],
): GeoKeyPoint[] {
  const keys: GeoKeyPoint[] = [];
  const radiusKm = request.radiusKm ?? 0;

  if (strategy === 'none') {
    return [{ geoKey: `nopool-${request.requestId}` }];
  }

  if (strategy === 'countryOnly') {
    const country = request.country?.toUpperCase();
    if (country) return [{ geoKey: `country:${country}` }];
    const city = request.city?.trim().toLowerCase();
    if (city) return [{ geoKey: `city:${city}` }];
    warnings.push('No country or city available for pooling.');
    return [{ geoKey: `nopool-${request.requestId}` }];
  }

  if (request.lat === null || request.lat === undefined || request.lng === null || request.lng === undefined) {
    warnings.push('Missing lat/lng for geohash pooling.');
    return [{ geoKey: `nopool-${request.requestId}` }];
  }

  keys.push({
    geoKey: geohashEncode(request.lat, request.lng, precision),
    lat: request.lat,
    lng: request.lng,
  });

  if (radiusKm > 0) {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((request.lat * Math.PI) / 180));
    const offsets = [
      { lat: request.lat + latDelta, lng: request.lng },
      { lat: request.lat - latDelta, lng: request.lng },
      { lat: request.lat, lng: request.lng + lngDelta },
      { lat: request.lat, lng: request.lng - lngDelta },
    ];
    for (const point of offsets) {
      keys.push({
        geoKey: geohashEncode(point.lat, point.lng, precision),
        lat: point.lat,
        lng: point.lng,
      });
    }
  }

  const unique = new Map<string, GeoKeyPoint>();
  for (const entry of keys) {
    if (!unique.has(entry.geoKey)) {
      unique.set(entry.geoKey, entry);
    }
  }
  let trimmed = Array.from(unique.values());

  if (maxKeysPerRun > 0 && trimmed.length > maxKeysPerRun) {
    trimmed = trimmed.slice(0, maxKeysPerRun);
    warnings.push('Pooling key cap reached; keys trimmed.');
  }

  if (tierCap > 0 && trimmed.length > tierCap) {
    trimmed = trimmed.slice(0, tierCap);
    warnings.push('Tier cap reached; pooled runs trimmed.');
  }

  return trimmed;
}
