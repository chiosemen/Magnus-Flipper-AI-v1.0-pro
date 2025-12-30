export type MarketplaceId =
  | "facebook"
  | "vinted"
  | "cex"
  | "gumtree"
  | "ebay"
  | "amazon"
  | "craigslist"
  | "auto";

export type MarketplaceTier = "free" | "pro" | "agency" | "enterprise";

export type GeoCapabilities = {
  supportsCountry: boolean;
  supportsPostal: boolean;
  supportsLatLng: boolean;
  supportsRadiusKm: boolean;
};

export type CostModel = {
  cuPerRun: number;
  cuPerItem: number;
  proxy: "datacenter" | "residential";
  pricingModel?: "per-run" | "per-result";
  pooledSafe?: boolean;
  minIntervalSeconds?: number;
};

export type ProxyPolicy = {
  type: "apify";
  groups: string[];
  countryRequired?: boolean;
  allowedCountries?: string[];
  notes?: string;
};

export type TierAvailability = {
  free: boolean;
  pro: boolean;
  agency: boolean;
};

export type ProxyDefaults = {
  country?: string | null;
};

export type ActorInputParams = {
  query: string;
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
};

type ActorInputContext = ActorInputParams & {
  proxyGroups: string[];
  proxyConfiguration?: { useApifyProxy: boolean; proxyGroups: string[] };
};

export type MarketplaceConfig = {
  id: MarketplaceId;
  label: string;
  actorId: string;
  regions: Array<"UK" | "US">;
  tierAvailability: TierAvailability;
  geoCapabilities: GeoCapabilities;
  costModel: CostModel;
  enabled: boolean;
  notes?: string;
  actorVersion?: string;
  proxyDefaults?: ProxyDefaults;
  proxyPolicy?: ProxyPolicy;
  buildInput: (params: ActorInputContext) => Record<string, any>;
  pooling: {
    enabled: boolean;
    key: "geohash" | "postal" | "country" | "none";
    maxRadiusKm: number;
    maxKeysPerRun?: number;
    maxConcurrency?: number;
    allowPooling?: boolean;
  };
};

const DEFAULT_DATASET_LIMIT = 20;
const DEFAULT_RADIUS_KM = 50;

function kmToMiles(km: number) {
  return Math.round(km * 0.621371);
}

function buildProxyGroups(params: ActorInputParams, config: MarketplaceConfig): string[] {
  const groups = [params.proxy, params.region].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  if (groups.length > 0) return groups;
  if (config.costModel.proxy === "residential") return ["RESIDENTIAL"];
  return [];
}

function buildProxyConfiguration(groups: string[]) {
  if (groups.length === 0) return undefined;
  return {
    useApifyProxy: true,
    proxyGroups: groups,
  };
}

function buildAmazonSearchUrl(query: string, country?: string | null) {
  const tld = country === "UK" ? "co.uk" : "com";
  return `https://www.amazon.${tld}/s?k=${encodeURIComponent(query)}`;
}

function buildEbaySearchUrl(
  query: string,
  country?: string | null,
  postal?: string | null,
  radiusMiles?: number,
) {
  const host = country === "UK" ? "www.ebay.co.uk" : "www.ebay.com";
  const url = new URL(`https://${host}/sch/i.html`);
  url.searchParams.set("_nkw", query);
  if (postal) {
    url.searchParams.set("_stpos", postal);
    if (radiusMiles) {
      url.searchParams.set("_sadis", String(radiusMiles));
    }
  }
  return url.toString();
}

function buildGumtreeSearchUrl(query: string, postal?: string | null) {
  const url = new URL("https://www.gumtree.com/search");
  url.searchParams.set("search_category", "all");
  url.searchParams.set("q", query);
  if (postal) {
    url.searchParams.set("search_location", postal);
  }
  return url.toString();
}

function buildCraigslistSearchUrl(query: string, locationText?: string | null) {
  const url = new URL("https://craigslist.org/search/sss");
  url.searchParams.set("query", query);
  if (locationText) {
    url.searchParams.set("search_location", locationText);
  }
  return url.toString();
}

function buildAutotraderSearchUrl(query: string, postal?: string | null, radiusMiles?: number) {
  const url = new URL("https://www.autotrader.com/cars-for-sale/all-cars");
  url.searchParams.set("keywordPhrases", query);
  if (postal) {
    url.searchParams.set("zip", postal);
  }
  if (radiusMiles) {
    url.searchParams.set("searchRadius", String(radiusMiles));
  }
  return url.toString();
}

function buildCexSearchUrl(query: string) {
  return `https://uk.webuy.com/search?stext=${encodeURIComponent(query)}`;
}

const MARKETPLACE_ENTRIES: Record<MarketplaceId, MarketplaceConfig> = {
  facebook: {
    id: "facebook",
    label: "Facebook Marketplace",
    actorId: "apify/facebook-marketplace-scraper",
    regions: ["UK", "US"],
    tierAvailability: { free: true, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: false,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: {
      cuPerRun: 1.2,
      cuPerItem: 0,
      proxy: "residential",
      pricingModel: "per-run",
      pooledSafe: true,
      minIntervalSeconds: 2,
    },
    enabled: true,
    buildInput: (params) => {
      const radiusKm = params.radiusKm ?? DEFAULT_RADIUS_KM;
      return {
        resultsLimit: params.limit ?? DEFAULT_DATASET_LIMIT,
        query: params.query,
        lat: params.lat,
        lng: params.lng,
        radius_km: radiusKm,
        ...(params.proxyConfiguration ? { proxyConfiguration: params.proxyConfiguration } : {}),
      };
    },
    pooling: {
      enabled: true,
      key: "geohash",
      maxRadiusKm: 120,
      maxKeysPerRun: 12,
    },
  },
  vinted: {
    id: "vinted",
    label: "Vinted",
    actorId: "silentflow/vinted-scraper-ppr",
    regions: ["UK", "US"],
    tierAvailability: { free: true, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: false,
      supportsLatLng: false,
      supportsRadiusKm: false,
    },
    costModel: {
      cuPerRun: 0.4,
      cuPerItem: 0.02,
      proxy: "residential",
      pricingModel: "per-result",
      pooledSafe: true,
      minIntervalSeconds: 2,
    },
    enabled: true,
    notes: "Vinted requires residential proxies; shared proxies are unreliable.",
    proxyPolicy: {
      type: "apify",
      groups: ["RESIDENTIAL"],
      countryRequired: true,
      allowedCountries: ["GB", "US"],
      notes: "Vinted blocks shared proxies — residential required for stability.",
    },
    buildInput: (params) => {
      return {
        browseMode: false,
        searchText: params.query,
        ...(params.country ? { country: params.country } : {}),
        ...(params.proxyConfiguration ? { proxyConfiguration: params.proxyConfiguration } : {}),
      };
    },
    pooling: {
      enabled: true,
      allowPooling: true,
      key: "country",
      maxRadiusKm: 0,
      maxKeysPerRun: 1,
      maxConcurrency: 1,
    },
  },
  cex: {
    id: "cex",
    label: "CeX",
    actorId: "sync-network/cex-product-scraper-uk-webuy-com",
    regions: ["UK"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: false,
      supportsRadiusKm: false,
    },
    costModel: {
      cuPerRun: 1.0,
      cuPerItem: 0,
      proxy: "datacenter",
      pricingModel: "per-run",
      pooledSafe: true,
      minIntervalSeconds: 3,
    },
    proxyDefaults: { country: "UK" },
    enabled: true,
    buildInput: (params) => {
      return {
        follow_pagination: false,
        include_images: true,
        include_stock_status: true,
        include_trade_values: true,
        retry_failed: true,
        startUrls: [{ url: buildCexSearchUrl(params.query) }],
        ...(params.proxyConfiguration ? { proxyConfiguration: params.proxyConfiguration } : {}),
      };
    },
    pooling: {
      enabled: true,
      key: "postal",
      maxRadiusKm: 0,
      maxKeysPerRun: 8,
    },
  },
  amazon: {
    id: "amazon",
    label: "Amazon",
    actorId: "axesso_data/amazon-product-details-scraper",
    regions: ["UK", "US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: false,
      supportsLatLng: false,
      supportsRadiusKm: false,
    },
    costModel: {
      cuPerRun: 1.4,
      cuPerItem: 0,
      proxy: "datacenter",
      pricingModel: "per-run",
      pooledSafe: false,
      minIntervalSeconds: 5,
    },
    enabled: true,
    buildInput: (params) => {
      return {
        urls: [buildAmazonSearchUrl(params.query, params.country)],
        ...(params.proxyConfiguration ? { proxyConfiguration: params.proxyConfiguration } : {}),
      };
    },
    pooling: {
      enabled: true,
      key: "country",
      maxRadiusKm: 0,
      maxKeysPerRun: 5,
    },
  },
  gumtree: {
    id: "gumtree",
    label: "Gumtree",
    actorId: "voyn/gumtree-scraper",
    regions: ["UK"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: {
      cuPerRun: 1.1,
      cuPerItem: 0,
      proxy: "residential",
      pricingModel: "per-run",
      pooledSafe: true,
      minIntervalSeconds: 3,
    },
    proxyDefaults: { country: "UK" },
    enabled: true,
    buildInput: (params) => {
      const proxy_config = {
        useApifyProxy: true,
        ...(params.proxyGroups.length ? { proxyGroups: params.proxyGroups } : {}),
      };
      return {
        gumtree_link: [buildGumtreeSearchUrl(params.query, params.postalCode ?? null)],
        proxy_config,
      };
    },
    pooling: {
      enabled: true,
      key: "geohash",
      maxRadiusKm: 50,
      maxKeysPerRun: 10,
    },
  },
  ebay: {
    id: "ebay",
    label: "eBay",
    actorId: "memo23/apify-ebay-search-cheerio",
    regions: ["UK", "US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: {
      cuPerRun: 1.0,
      cuPerItem: 0,
      proxy: "residential",
      pricingModel: "per-run",
      pooledSafe: true,
      minIntervalSeconds: 3,
    },
    enabled: true,
    buildInput: (params) => {
      const proxyGroups = params.proxyGroups.length ? params.proxyGroups : ["RESIDENTIAL"];
      return {
        enablePriceMonitoring: false,
        monitoringMode: false,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: proxyGroups,
        },
        startUrls: [
          {
            url: buildEbaySearchUrl(
              params.query,
              params.country ?? null,
              params.postalCode ?? null,
              kmToMiles(params.radiusKm ?? DEFAULT_RADIUS_KM),
            ),
          },
        ],
      };
    },
    pooling: {
      enabled: true,
      key: "geohash",
      maxRadiusKm: 100,
      maxKeysPerRun: 12,
    },
  },
  craigslist: {
    id: "craigslist",
    label: "Craigslist",
    actorId: "easyapi/craigslist-search-results-scraper",
    regions: ["US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: {
      cuPerRun: 0.9,
      cuPerItem: 0,
      proxy: "datacenter",
      pricingModel: "per-run",
      pooledSafe: true,
      minIntervalSeconds: 3,
    },
    proxyDefaults: { country: "US" },
    enabled: true,
    buildInput: (params) => {
      return {
        searchUrls: [buildCraigslistSearchUrl(params.query, params.locationText ?? null)],
        maxItems: 130,
        ...(params.proxyConfiguration ? { proxyConfiguration: params.proxyConfiguration } : {}),
      };
    },
    pooling: {
      enabled: true,
      key: "geohash",
      maxRadiusKm: 80,
      maxKeysPerRun: 10,
    },
  },
  auto: {
    id: "auto",
    label: "Auto",
    actorId: "epctex/autotrader-scraper",
    regions: ["US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: {
      cuPerRun: 1.0,
      cuPerItem: 0,
      proxy: "residential",
      pricingModel: "per-run",
      pooledSafe: true,
      minIntervalSeconds: 4,
    },
    proxyDefaults: { country: "US" },
    enabled: true,
    buildInput: (params) => {
      const proxyGroups = params.proxyGroups.length ? params.proxyGroups : ["RESIDENTIAL"];
      return {
        proxy: { useApifyProxy: true, apifyProxyGroups: proxyGroups },
        startUrls: [
          {
            url: buildAutotraderSearchUrl(
              params.query,
              params.postalCode ?? null,
              kmToMiles(params.radiusKm ?? DEFAULT_RADIUS_KM),
            ),
          },
        ],
        maxItems: 20,
      };
    },
    pooling: {
      enabled: true,
      key: "geohash",
      maxRadiusKm: 75,
      maxKeysPerRun: 10,
    },
  },
};

function freezeRegistry(registry: Record<MarketplaceId, MarketplaceConfig>) {
  for (const market of Object.values(registry)) {
    Object.freeze(market.geoCapabilities);
    Object.freeze(market.tierAvailability);
    Object.freeze(market.costModel);
    Object.freeze(market.pooling);
    if (market.proxyDefaults) Object.freeze(market.proxyDefaults);
    Object.freeze(market);
  }
  return Object.freeze(registry);
}

export const MARKETPLACES = freezeRegistry(MARKETPLACE_ENTRIES);

export function getAllowedMarketsForTier(tier: MarketplaceTier): MarketplaceId[] {
  if (tier === "enterprise") {
    return Object.values(MARKETPLACES)
      .filter((market) => market.enabled && market.tierAvailability.agency)
      .map((market) => market.id);
  }
  return Object.values(MARKETPLACES)
    .filter((market) => market.enabled && market.tierAvailability[tier])
    .map((market) => market.id);
}

export function getMarketCapabilities(market: MarketplaceId): GeoCapabilities {
  return MARKETPLACES[market].geoCapabilities;
}

export function estimateCuForRun(input: {
  markets: MarketplaceId[];
  queries: string[];
  itemsExpected?: number;
}) {
  const itemsExpected = Math.max(0, input.itemsExpected ?? 0);
  const byMarket: Record<string, number> = {};
  let total = 0;

  for (const market of input.markets) {
    const config = MARKETPLACES[market];
    if (!config) continue;
    const perQuery =
      config.costModel.cuPerRun + config.costModel.cuPerItem * itemsExpected;
    const estimate = perQuery * Math.max(input.queries.length, 1);
    byMarket[market] = Number(estimate.toFixed(2));
    total += estimate;
  }

  return {
    total: Number(total.toFixed(2)),
    byMarket,
  };
}

export function buildActorInput(market: MarketplaceId, params: ActorInputParams) {
  const config = MARKETPLACES[market];
  const proxyGroups = buildProxyGroups(params, config);
  const proxyConfiguration = buildProxyConfiguration(proxyGroups);
  return config.buildInput({ ...params, proxyGroups, proxyConfiguration });
}

export function getMarketplaceActorId(market: MarketplaceId): string {
  const config = MARKETPLACES[market];
  if (config.actorVersion) {
    return `${config.actorId}:${config.actorVersion}`;
  }
  return config.actorId;
}

export function getProxyDefaults(market: MarketplaceId): {
  type: "datacenter" | "residential";
  country: string | null;
} {
  const config = MARKETPLACES[market];
  return {
    type: config.costModel.proxy,
    country: config.proxyDefaults?.country ?? null,
  };
}

export function getProxyGroupsForMarket(
  market: MarketplaceId,
  params: ActorInputParams,
): string[] {
  return buildProxyGroups(params, MARKETPLACES[market]);
}

function assertMarketplaceRegistry(registry: Record<MarketplaceId, MarketplaceConfig>) {
  const seen = new Set<string>();
  for (const [key, value] of Object.entries(registry)) {
    if (value.id !== key) {
      throw new Error(`Marketplace registry mismatch for ${key}`);
    }
    if (seen.has(value.id)) {
      throw new Error(`Duplicate marketplace id: ${value.id}`);
    }
    seen.add(value.id);
  }
}

if (process.env.NODE_ENV !== "production") {
  assertMarketplaceRegistry(MARKETPLACES);
}
