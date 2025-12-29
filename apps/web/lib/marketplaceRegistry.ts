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
};

export type TierAvailability = {
  free: boolean;
  pro: boolean;
  agency: boolean;
};

export type MarketplaceConfig = {
  id: MarketplaceId;
  label: string;
  regions: Array<"UK" | "US">;
  tierAvailability: TierAvailability;
  geoCapabilities: GeoCapabilities;
  costModel: CostModel;
  enabled: boolean;
};

export const MARKETPLACES: Record<MarketplaceId, MarketplaceConfig> = {
  facebook: {
    id: "facebook",
    label: "Facebook Marketplace",
    regions: ["UK", "US"],
    tierAvailability: { free: true, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: false,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 1.2, cuPerItem: 0, proxy: "residential" },
    enabled: true,
  },
  vinted: {
    id: "vinted",
    label: "Vinted",
    regions: ["UK", "US"],
    tierAvailability: { free: true, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: false,
      supportsLatLng: false,
      supportsRadiusKm: false,
    },
    costModel: { cuPerRun: 0.4, cuPerItem: 0.02, proxy: "datacenter" },
    enabled: true,
  },
  cex: {
    id: "cex",
    label: "CeX",
    regions: ["UK"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: false,
      supportsRadiusKm: false,
    },
    costModel: { cuPerRun: 1.0, cuPerItem: 0, proxy: "datacenter" },
    enabled: true,
  },
  amazon: {
    id: "amazon",
    label: "Amazon",
    regions: ["UK", "US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: false,
      supportsLatLng: false,
      supportsRadiusKm: false,
    },
    costModel: { cuPerRun: 1.4, cuPerItem: 0, proxy: "datacenter" },
    enabled: true,
  },
  gumtree: {
    id: "gumtree",
    label: "Gumtree",
    regions: ["UK"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 1.1, cuPerItem: 0, proxy: "residential" },
    enabled: true,
  },
  ebay: {
    id: "ebay",
    label: "eBay",
    regions: ["UK", "US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 1.0, cuPerItem: 0, proxy: "residential" },
    enabled: true,
  },
  craigslist: {
    id: "craigslist",
    label: "Craigslist",
    regions: ["US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 0.9, cuPerItem: 0, proxy: "datacenter" },
    enabled: true,
  },
  auto: {
    id: "auto",
    label: "Auto",
    regions: ["US"],
    tierAvailability: { free: false, pro: true, agency: true },
    geoCapabilities: {
      supportsCountry: true,
      supportsPostal: true,
      supportsLatLng: true,
      supportsRadiusKm: true,
    },
    costModel: { cuPerRun: 1.0, cuPerItem: 0, proxy: "residential" },
    enabled: true,
  },
};
