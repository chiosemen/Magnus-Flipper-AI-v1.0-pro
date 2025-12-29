import { ApifyClient } from 'apify-client';
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
  const startedAt = Date.now();
  const input = buildActorInput(market, query, options);
  const run = await client.actor(actorId).call(input);
  const limit = options.limit ?? DEFAULT_DATASET_LIMIT;
  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems({ limit });

  return {
    market,
    query,
    actorId,
    runId: run.id,
    datasetId: run.defaultDatasetId,
    durationMs: Date.now() - startedAt,
    count: items.length,
    items,
  };
}
