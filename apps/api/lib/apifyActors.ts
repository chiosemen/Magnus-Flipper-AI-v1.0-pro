import { ApifyClient } from 'apify-client';
import { runActor, type RunActorOptions } from './apifyClient';
import { MARKETPLACES, type MarketplaceId } from './marketplaceRegistry';

type MarketplaceOptions = {
  client?: ApifyClient;
  locationText?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  country?: string;
  limit?: number;
  proxy?: string;
  region?: string;
  runOptions?: RunActorOptions;
};

const DEFAULT_DATASET_LIMIT = 20;
const DEFAULT_RADIUS_KM = 50;

function buildProxyConfiguration(options: MarketplaceOptions) {
  const proxyGroups = [options.proxy, options.region].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );
  if (proxyGroups.length === 0) return undefined;
  return {
    useApifyProxy: true,
    proxyGroups,
  };
}

function buildActorInput(market: MarketplaceId, query: string, options: MarketplaceOptions) {
  const proxyConfiguration = buildProxyConfiguration(options);

  switch (market) {
    case 'facebook': {
      const lat = options.lat;
      const lng = options.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new Error('Missing lat/lng for facebook search');
      }
      return {
        query,
        lat,
        lng,
        radius_km: options.radiusKm ?? DEFAULT_RADIUS_KM,
        resultsLimit: options.limit ?? DEFAULT_DATASET_LIMIT,
        ...(proxyConfiguration ? { proxyConfiguration } : {}),
      };
    }
    case 'vinted': {
      return {
        browseMode: false,
        searchText: query,
        ...(options.country ? { country: options.country } : {}),
        ...(proxyConfiguration ? { proxyConfiguration } : {}),
      };
    }
    default:
      throw new Error(`Marketplace ${market} does not have actor input defined`);
  }
}

export async function runMarketplaceActor(
  market: MarketplaceId,
  query: string,
  options: MarketplaceOptions = {},
) {
  const config = MARKETPLACES[market];
  if (!config) {
    throw new Error(`Unsupported market: ${market}`);
  }
  if (!config.enabled) {
    throw new Error(`Marketplace disabled: ${market}`);
  }

  const actorId = config.actor.versionTag
    ? `${config.actor.actorId}:${config.actor.versionTag}`
    : config.actor.actorId;
  if (actorId.includes('apify-actor-id-here')) {
    throw new Error(`Marketplace actor not configured: ${market}`);
  }

  const token = process.env.APIFY_TOKEN;
  if (!token && !options.client) {
    throw new Error('APIFY_TOKEN missing');
  }

  const client = options.client ?? new ApifyClient({ token });
  const input = buildActorInput(market, query, options);
  const limit = options.limit ?? DEFAULT_DATASET_LIMIT;
  const runResult = await runActor(actorId, input, {
    client,
    itemsLimit: limit,
    ...options.runOptions,
  });

  return {
    market,
    query,
    actorId,
    runId: runResult.runId,
    status: runResult.status,
    durationMs: runResult.meta.durationMs,
    count: runResult.items.length,
    items: runResult.items,
    meta: runResult.meta,
  };
}
