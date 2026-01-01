export type MarketplaceId =
  | "facebook"
  | "vinted"
  | "cex"
  | "gumtree"
  | "ebay"
  | "amazon"
  | "craigslist"
  | "auto";

export type TierAvailability = {
  free: boolean;
  pro: boolean;
  agency: boolean;
};

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
};

export type MarketplaceConfig = {
  id: MarketplaceId;
  label: string;
  enabled: boolean;
  regions: Array<"UK" | "US">;
  tierAvailability: TierAvailability;
  geoCapabilities: GeoCapabilities;
  costModel: CostModel;
};

export const MARKETPLACES: Record<MarketplaceId, MarketplaceConfig> = {
  facebook: {
    id: "facebook",
    label: "Facebook Marketplace",
    enabled: true,
    regions: ["UK", "US"],
    tierAvailability: { free: true, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: false,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 1.2, cuPerItem: 0, proxy: "residential" },
  },
  vinted: {
    id: "vinted",
    label: "Vinted",
    enabled: true,
    regions: ["UK", "US"],
    tierAvailability: { free: true, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: false,
      supportsLatLng: false,
      supportsRadiusKm: false,
    },
    costModel: { cuPerRun: 0.4, cuPerItem: 0.02, proxy: "datacenter" },
  },
  cex: {
    id: "cex",
    label: "CeX",
    enabled: true,
    regions: ["UK"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: false,
      supportsRadiusKm: false,
    },
    costModel: { cuPerRun: 1.0, cuPerItem: 0, proxy: "datacenter" },
  },
  gumtree: {
    id: "gumtree",
    label: "Gumtree",
    enabled: true,
    regions: ["UK"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 1.1, cuPerItem: 0, proxy: "residential" },
  },
  ebay: {
    id: "ebay",
    label: "eBay",
    enabled: true,
    regions: ["UK", "US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 1.0, cuPerItem: 0, proxy: "residential" },
  },
  amazon: {
    id: "amazon",
    label: "Amazon",
    enabled: true,
    regions: ["UK", "US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: false,
      supportsLatLng: false,
      supportsRadiusKm: false,
    },
    costModel: { cuPerRun: 1.4, cuPerItem: 0, proxy: "datacenter" },
  },
  craigslist: {
    id: "craigslist",
    label: "Craigslist",
    enabled: true,
    regions: ["US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 0.9, cuPerItem: 0, proxy: "datacenter" },
  },
  auto: {
    id: "auto",
    label: "Auto",
    enabled: true,
    regions: ["US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 1.0, cuPerItem: 0, proxy: "residential" },
  },
};

export const MARKETPLACE_LIST = Object.values(MARKETPLACES).filter(
  (market) => market.enabled
);

export function getMarketplaceLabel(id: MarketplaceId): string {
  return MARKETPLACES[id]?.label ?? id;
}
