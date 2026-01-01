import { ApifyClient } from "apify-client";
import { runActor, type RunActorOptions } from "./apifyClient";
import {
  buildActorInput,
  getMarketplaceActorId,
  getProxyDefaults,
  getProxyGroupsForMarket,
  MARKETPLACES,
  type ActorInputParams,
  type MarketplaceId,
  type ProxyPolicy,
} from "./marketplaceRegistry";

type MarketplaceOptions = {
  client?: ApifyClient;
  locationText?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  country?: string;
  category?: string;
  limit?: number;
  proxy?: string;
  region?: string;
  runOptions?: RunActorOptions;
};

const DEFAULT_DATASET_LIMIT = 20;

function normalizeProxyCountry(
  input: string | null | undefined,
  allowed?: string[],
) {
  if (!input) return allowed?.[0] ?? null;
  const upper = input.trim().toUpperCase();
  if (upper === "UK") return "GB";
  if (upper === "GB") return "GB";
  if (upper === "US") return "US";
  if (allowed && !allowed.includes(upper)) {
    return allowed[0] ?? null;
  }
  return upper;
}

function applyProxyPolicy(
  input: Record<string, any>,
  policy: ProxyPolicy | undefined,
  params: ActorInputParams,
) {
  if (!policy || policy.type !== "apify") return input;
  const proxyCountry = normalizeProxyCountry(params.country ?? null, policy.allowedCountries);
  const proxyGroups = policy.groups.length > 0 ? policy.groups : ["RESIDENTIAL"];
  return {
    ...input,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: proxyGroups,
      ...(proxyCountry ? { apifyProxyCountry: proxyCountry } : {}),
    },
    proxyConfiguration: {
      useApifyProxy: true,
      proxyGroups: proxyGroups,
      ...(proxyCountry ? { proxyCountry } : {}),
    },
  };
}

function buildGeoUsed(
  params: ActorInputParams,
  supportsRadiusKm: boolean,
  supportsLatLng: boolean,
) {
  return {
    lat: supportsLatLng ? params.lat ?? null : null,
    lng: supportsLatLng ? params.lng ?? null : null,
    radiusKm: supportsRadiusKm ? params.radiusKm ?? null : null,
    postalCode: params.postalCode ?? null,
    country: params.country ?? null,
  };
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

  const actorId = getMarketplaceActorId(market);
  const token = process.env.APIFY_TOKEN;
  if (!token && !options.client) {
    throw new Error("APIFY_TOKEN missing");
  }

  const client = options.client ?? new ApifyClient({ token });
  const params: ActorInputParams = {
    query,
    locationText: options.locationText,
    postalCode: options.postalCode,
    lat: options.lat,
    lng: options.lng,
    radiusKm: options.radiusKm,
    country: options.country,
    category: options.category,
    limit: options.limit,
    proxy: options.proxy,
    region: options.region,
  };

  let input = buildActorInput(market, params);
  // Vinted blocks shared proxies — residential required for stability.
  input = applyProxyPolicy(input, config.proxyPolicy, params);
  const limit = options.limit ?? DEFAULT_DATASET_LIMIT;

  const runResult = await runActor(actorId, input, {
    client,
    itemsLimit: limit,
    ...options.runOptions,
  });

  const proxyDefaults = getProxyDefaults(market);
  const proxyGroups =
    config.proxyPolicy?.groups?.length ? config.proxyPolicy.groups : getProxyGroupsForMarket(market, params);
  const proxyCountry = normalizeProxyCountry(
    params.country ?? null,
    config.proxyPolicy?.allowedCountries,
  );
  const cuEstimated =
    config.costModel.cuPerRun +
    config.costModel.cuPerItem * runResult.items.length;

  return {
    market,
    query,
    actorId,
    runId: runResult.runId,
    status: runResult.status,
    durationMs: runResult.meta.durationMs,
    count: runResult.items.length,
    items: runResult.items,
    meta: {
      ...runResult.meta,
      marketId: market,
      actorId,
      geoUsed: buildGeoUsed(
        params,
        config.geoCapabilities.supportsRadiusKm,
        config.geoCapabilities.supportsLatLng,
      ),
      proxyUsed: {
        type: proxyDefaults.type,
        country: proxyCountry ?? proxyDefaults.country ?? null,
        groups: proxyGroups,
      },
      cuEstimated,
    },
  };
}
