import { ApifyClient } from 'apify-client';

type Marketplace = 'facebook' | 'vinted';

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

type ActorDefinition = {
  actorId: string;
  buildInput: (query: string, options: MarketplaceOptions) => Record<string, any>;
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

const ACTOR_MAP: Record<Marketplace, ActorDefinition> = {
  facebook: {
    actorId: 'apify/facebook-marketplace-scraper',
    buildInput: (query, options) => {
      const proxyConfiguration = buildProxyConfiguration(options);
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
    },
  },
  vinted: {
    actorId: 'silentflow/vinted-scraper-ppr',
    buildInput: (query, options) => {
      const proxyConfiguration = buildProxyConfiguration(options);
      return {
        browseMode: false,
        searchText: query,
        ...(options.country ? { country: options.country } : {}),
        ...(proxyConfiguration ? { proxyConfiguration } : {}),
      };
    },
  },
};

export async function runMarketplaceActor(
  market: Marketplace,
  query: string,
  options: MarketplaceOptions = {},
) {
  const definition = ACTOR_MAP[market];
  if (!definition) {
    throw new Error(`Unsupported market: ${market}`);
  }

  const token = process.env.APIFY_TOKEN;
  if (!token && !options.client) {
    throw new Error('APIFY_TOKEN missing');
  }

  const client = options.client ?? new ApifyClient({ token });
  const startedAt = Date.now();
  const input = definition.buildInput(query, options);
  const run = await client.actor(definition.actorId).call(input);
  const limit = options.limit ?? DEFAULT_DATASET_LIMIT;
  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems({ limit });

  return {
    market,
    query,
    actorId: definition.actorId,
    runId: run.id,
    datasetId: run.defaultDatasetId,
    durationMs: Date.now() - startedAt,
    count: items.length,
    items,
  };
}
