import type { RiskLevel } from "./types";

export type Region = "US" | "UK";

export type MarketplaceCapability = {
  marketplace: string;
  regions: Region[];
  supportsImages: boolean;
  supportsInstant: boolean;
  riskLevel: RiskLevel;
  // Optional marketplaces can be hidden unless explicitly enabled by the app.
  optional?: boolean;
};

export const MARKETPLACE_CAPABILITIES: MarketplaceCapability[] = [
  {
    marketplace: "facebook",
    regions: ["US", "UK"],
    supportsImages: true,
    supportsInstant: true,
    riskLevel: "high",
  },
  {
    marketplace: "craigslist",
    regions: ["US"],
    supportsImages: true,
    supportsInstant: true,
    riskLevel: "medium",
  },
  {
    marketplace: "offerup",
    regions: ["US"],
    supportsImages: true,
    supportsInstant: true,
    riskLevel: "high",
  },
  {
    marketplace: "gumtree",
    regions: ["UK"],
    supportsImages: true,
    supportsInstant: true,
    riskLevel: "medium",
  },
  {
    marketplace: "ebay",
    regions: ["UK"],
    supportsImages: true,
    supportsInstant: true,
    riskLevel: "medium",
  },
  {
    marketplace: "vinted",
    regions: ["UK"],
    supportsImages: true,
    supportsInstant: false,
    riskLevel: "medium",
  },
  {
    marketplace: "cars",
    regions: ["US", "UK"],
    supportsImages: true,
    supportsInstant: true,
    riskLevel: "low",
  },
  {
    marketplace: "shpock",
    regions: ["UK"],
    supportsImages: true,
    supportsInstant: false,
    riskLevel: "medium",
    optional: true,
  },
];

export function getSupportedMarketplacesForRegion(region: Region, opts?: { includeOptional?: boolean }): string[] {
  const includeOptional = Boolean(opts?.includeOptional);
  return MARKETPLACE_CAPABILITIES.filter((m) => m.regions.includes(region) && (includeOptional || !m.optional))
    .map((m) => m.marketplace);
}

export function isMarketplaceSupportedInRegion(
  marketplace: string,
  region: Region,
  opts?: { includeOptional?: boolean }
): boolean {
  const normalized = marketplace.trim().toLowerCase();
  const supported = getSupportedMarketplacesForRegion(region, opts);
  return supported.includes(normalized);
}

