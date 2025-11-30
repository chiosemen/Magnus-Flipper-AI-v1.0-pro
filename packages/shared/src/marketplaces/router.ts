export type MarketplaceType = "VINTED" | "EBAY" | "GUMTREE" | "UNKNOWN";

export function resolveMarketplace(urlOrText: string): MarketplaceType {
  const normalized = urlOrText.toLowerCase();

  if (normalized.includes("vinted.com") || normalized.includes("vinted")) {
    return "VINTED";
  }

  if (normalized.includes("ebay.com") || normalized.includes("ebay")) {
    return "EBAY";
  }

  if (normalized.includes("gumtree.com") || normalized.includes("gumtree")) {
    return "GUMTREE";
  }

  return "UNKNOWN";
}
