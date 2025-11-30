import { useMemo } from "react";

const MARKETPLACE_ROUTES: Record<string, string> = {
  FB_MARKETPLACE: "facebook",
  CRAIGSLIST: "craigslist",
  OFFERUP: "offerup",
  VINTED: "vinted",
  EBAY: "ebay",
  GUMTREE: "gumtree",
};

export function useMarketplaceRouter() {
  const getRoute = useMemo(
    () => (marketplace: string) => {
      const normalized = marketplace?.toUpperCase() || "";
      return MARKETPLACE_ROUTES[normalized] || marketplace?.toLowerCase() || "marketplace";
    },
    []
  );

  const getMarketplaceId = useMemo(
    () => (route: string) => {
      const entry = Object.entries(MARKETPLACE_ROUTES).find(([_, value]) => value === route);
      return entry ? entry[0] : route?.toUpperCase();
    },
    []
  );

  const getAllMarketplaces = useMemo(() => Object.keys(MARKETPLACE_ROUTES), []);

  const getAllRoutes = useMemo(() => Object.values(MARKETPLACE_ROUTES), []);

  return {
    getRoute,
    getMarketplaceId,
    getAllMarketplaces,
    getAllRoutes,
    marketplaceRoutes: MARKETPLACE_ROUTES,
  };
}
