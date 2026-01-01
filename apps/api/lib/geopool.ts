import { MARKETPLACES, type MarketplaceId } from './marketplaceRegistry';

type PoolingStrategy = 'geohash' | 'postal' | 'country' | 'none';

export type PoolRequest = {
  requestId: string;
  userId?: string | null;
  marketplaceId: MarketplaceId;
  query: string;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  postalCode?: string | null;
  tier: string;
  maxResults?: number | null;
  country?: string | null;
  city?: string | null;
  poolingOverride?: { enabled: boolean; reason?: string };
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
  postalCode?: string | null;
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

export function getGeohashPrecision(radiusKm: number): number | null {
  if (radiusKm <= 5) return 7; // Street-level
  if (radiusKm <= 15) return 6; // Neighborhood-level
  if (radiusKm <= 50) return 5; // City-level
  if (radiusKm <= 100) return 4; // Metro-level
  return null; // Too wide to pool safely
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
      warnings.push('Marketplace unavailable for this scan.');
      continue;
    }

    const normalizedQuery = normalizeQuery(request.query);
    const normalizedCategory = normalizeCategory(request.category);
    const tierCap = tierRunCaps[request.tier] ?? 1;
    const radiusKm = request.radiusKm ?? 0;
    const precision = getGeohashPrecision(radiusKm);

    let strategy: PoolingStrategy = marketplace.pooling.key;
    let poolingEnabled = marketplace.pooling.enabled;

    if (request.poolingOverride) {
      poolingEnabled = request.poolingOverride.enabled;
      if (!poolingEnabled) {
        strategy = 'none';
      }
      if (request.poolingOverride.reason) {
        warnings.push(request.poolingOverride.reason);
      }
    }

    if (!marketplace.geoCapabilities.supportsRadiusKm && poolingEnabled) {
      strategy = marketplace.pooling.key === 'country' ? 'country' : 'none';
      warnings.push('Radius was not applied for this marketplace.');
    }

    if (strategy === 'geohash' && precision === null) {
      strategy = 'none';
      poolingEnabled = false;
      warnings.push('Radius is too broad for precision pooling.');
    }

    if (strategy === 'none') {
      poolingEnabled = false;
    }

    const geoKeys = buildGeoKeys(
      request,
      strategy,
      precision,
      marketplace.pooling.maxKeysPerRun ?? 0,
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
          radiusKm: marketplace.geoCapabilities.supportsRadiusKm ? request.radiusKm ?? null : null,
          postalCode: request.postalCode ?? null,
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
  precision: number | null,
  maxKeysPerRun: number,
  tierCap: number,
  warnings: string[],
): GeoKeyPoint[] {
  const keys: GeoKeyPoint[] = [];
  const radiusKm = request.radiusKm ?? 0;

  if (strategy === 'none') {
    return [{ geoKey: `nopool-${request.requestId}` }];
  }

  if (strategy === 'country') {
    const country = request.country?.toUpperCase();
    if (country) return [{ geoKey: `country:${country}` }];
    const city = request.city?.trim().toLowerCase();
    if (city) return [{ geoKey: `city:${city}` }];
    warnings.push('No country or city available for pooling.');
    return [{ geoKey: `nopool-${request.requestId}` }];
  }

  if (strategy === 'postal') {
    const postal = request.postalCode?.trim().toUpperCase();
    if (postal) return [{ geoKey: `postal:${postal}` }];
    warnings.push('Missing postal code for postal pooling.');
    return [{ geoKey: `nopool-${request.requestId}` }];
  }

  if (request.lat === null || request.lat === undefined || request.lng === null || request.lng === undefined) {
    warnings.push('Missing lat/lng for geohash pooling.');
    return [{ geoKey: `nopool-${request.requestId}` }];
  }
  if (precision === null) {
    warnings.push('Geohash precision unavailable for requested radius.');
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
