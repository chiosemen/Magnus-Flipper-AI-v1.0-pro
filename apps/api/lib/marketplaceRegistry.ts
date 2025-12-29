export type MarketplaceId =
  | "facebook"
  | "vinted"
  | "cex"
  | "gumtree"
  | "ebay"
  | "amazon"
  | "craigslist"
  | "auto";

export type GeoCapability = {
  supportsPostalToLatLng: boolean;
  supportsRadius: boolean;
  supportsBoundingBox: boolean;
  supportsCountry: boolean;
  supportsCity: boolean;
  notes?: string;
};

export type CostProfile = {
  pricingModel: "perRun" | "perResult" | "flat" | "unknown";
  estCostPer1k?: number;
  estCostPerRun?: number;
  maxConcurrencyRecommended?: number;
};

export type ActorRef = {
  actorId: string;
  versionTag?: string;
  inputSchemaHints?: Record<string, any>;
};

export type MarketplaceConfig = {
  id: MarketplaceId;
  label: string;
  enabled: boolean;
  actor: ActorRef;
  geo: GeoCapability;
  pooling: {
    enabled: boolean;
    strategy: "geohash" | "countryOnly" | "none";
    precision: number;
    maxKeysPerRun: number;
  };
  tierAccess: { free: boolean; pro: boolean; agency: boolean; enterprise: boolean };
  search: {
    supportsQuery: boolean;
    supportsCategory: boolean;
    supportsPriceMinMax: boolean;
    supportsCondition: boolean;
  };
};

export const MARKETPLACES: Record<MarketplaceId, MarketplaceConfig> = {
  facebook: {
    id: "facebook",
    label: "Facebook Marketplace",
    enabled: true,
    actor: {
      actorId: "apify/facebook-marketplace-scraper",
      inputSchemaHints: {
        resultsLimit: "number",
        query: "string",
        lat: "number",
        lng: "number",
        radius_km: "number",
      },
    },
    geo: {
      supportsPostalToLatLng: false,
      supportsRadius: true,
      supportsBoundingBox: false,
      supportsCountry: true,
      supportsCity: true,
      notes: "Requires lat/lng for radius searches.",
    },
    pooling: {
      enabled: true,
      strategy: "geohash",
      precision: 5,
      maxKeysPerRun: 12,
    },
    tierAccess: { free: true, pro: true, agency: true, enterprise: true },
    search: {
      supportsQuery: true,
      supportsCategory: false,
      supportsPriceMinMax: false,
      supportsCondition: false,
    },
  },
  vinted: {
    id: "vinted",
    label: "Vinted",
    enabled: true,
    actor: {
      actorId: "silentflow/vinted-scraper-ppr",
      inputSchemaHints: {
        browseMode: false,
        searchText: "string",
      },
    },
    geo: {
      supportsPostalToLatLng: false,
      supportsRadius: false,
      supportsBoundingBox: false,
      supportsCountry: true,
      supportsCity: false,
      notes: "Country-level filtering only.",
    },
    pooling: {
      enabled: false,
      strategy: "none",
      precision: 0,
      maxKeysPerRun: 0,
    },
    tierAccess: { free: true, pro: true, agency: true, enterprise: true },
    search: {
      supportsQuery: true,
      supportsCategory: false,
      supportsPriceMinMax: false,
      supportsCondition: false,
    },
  },
  cex: {
    id: "cex",
    label: "CeX",
    enabled: false,
    actor: { actorId: "apify-actor-id-here" },
    geo: {
      supportsPostalToLatLng: false,
      supportsRadius: false,
      supportsBoundingBox: false,
      supportsCountry: true,
      supportsCity: false,
    },
    pooling: {
      enabled: false,
      strategy: "none",
      precision: 0,
      maxKeysPerRun: 0,
    },
    tierAccess: { free: false, pro: false, agency: false, enterprise: false },
    search: {
      supportsQuery: true,
      supportsCategory: false,
      supportsPriceMinMax: true,
      supportsCondition: true,
    },
  },
  gumtree: {
    id: "gumtree",
    label: "Gumtree",
    enabled: false,
    actor: { actorId: "apify-actor-id-here" },
    geo: {
      supportsPostalToLatLng: false,
      supportsRadius: true,
      supportsBoundingBox: false,
      supportsCountry: true,
      supportsCity: true,
    },
    pooling: {
      enabled: false,
      strategy: "none",
      precision: 0,
      maxKeysPerRun: 0,
    },
    tierAccess: { free: false, pro: false, agency: false, enterprise: false },
    search: {
      supportsQuery: true,
      supportsCategory: true,
      supportsPriceMinMax: true,
      supportsCondition: true,
    },
  },
  ebay: {
    id: "ebay",
    label: "eBay",
    enabled: false,
    actor: { actorId: "apify-actor-id-here" },
    geo: {
      supportsPostalToLatLng: false,
      supportsRadius: false,
      supportsBoundingBox: false,
      supportsCountry: true,
      supportsCity: false,
    },
    pooling: {
      enabled: false,
      strategy: "none",
      precision: 0,
      maxKeysPerRun: 0,
    },
    tierAccess: { free: false, pro: false, agency: false, enterprise: false },
    search: {
      supportsQuery: true,
      supportsCategory: true,
      supportsPriceMinMax: true,
      supportsCondition: true,
    },
  },
  amazon: {
    id: "amazon",
    label: "Amazon",
    enabled: false,
    actor: { actorId: "apify-actor-id-here" },
    geo: {
      supportsPostalToLatLng: false,
      supportsRadius: false,
      supportsBoundingBox: false,
      supportsCountry: true,
      supportsCity: false,
    },
    pooling: {
      enabled: false,
      strategy: "none",
      precision: 0,
      maxKeysPerRun: 0,
    },
    tierAccess: { free: false, pro: false, agency: false, enterprise: false },
    search: {
      supportsQuery: true,
      supportsCategory: true,
      supportsPriceMinMax: true,
      supportsCondition: true,
    },
  },
  craigslist: {
    id: "craigslist",
    label: "Craigslist",
    enabled: false,
    actor: { actorId: "apify-actor-id-here" },
    geo: {
      supportsPostalToLatLng: false,
      supportsRadius: true,
      supportsBoundingBox: false,
      supportsCountry: true,
      supportsCity: true,
    },
    pooling: {
      enabled: false,
      strategy: "none",
      precision: 0,
      maxKeysPerRun: 0,
    },
    tierAccess: { free: false, pro: false, agency: false, enterprise: false },
    search: {
      supportsQuery: true,
      supportsCategory: true,
      supportsPriceMinMax: true,
      supportsCondition: true,
    },
  },
  auto: {
    id: "auto",
    label: "AutoTrader",
    enabled: false,
    actor: { actorId: "apify-actor-id-here" },
    geo: {
      supportsPostalToLatLng: false,
      supportsRadius: true,
      supportsBoundingBox: false,
      supportsCountry: true,
      supportsCity: true,
    },
    pooling: {
      enabled: false,
      strategy: "none",
      precision: 0,
      maxKeysPerRun: 0,
    },
    tierAccess: { free: false, pro: false, agency: false, enterprise: false },
    search: {
      supportsQuery: true,
      supportsCategory: true,
      supportsPriceMinMax: true,
      supportsCondition: true,
    },
  },
};

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

assertMarketplaceRegistry(MARKETPLACES);
