export interface Marketplace {
  name: string;
  slug: string;
  icon?: string;
  tagline: string;
  refresh: string;
}

export const marketplaces: Marketplace[] = [
  {
    name: "eBay",
    slug: "ebay",
    tagline: "Auctions, snipes & mispriced stock",
    refresh: "Every 30s",
  },
  {
    name: "Amazon",
    slug: "amazon",
    tagline: "Retail arbitrage & FBA flips",
    refresh: "Every 60s",
  },
  {
    name: "Facebook Marketplace",
    slug: "facebook-marketplace",
    tagline: "Local steals before anyone else",
    refresh: "Every 45s",
  },
  {
    name: "Craigslist",
    slug: "craigslist",
    tagline: "Big-ticket local arbitrage",
    refresh: "Every 90s",
  },
  {
    name: "OfferUp",
    slug: "offerup",
    tagline: "Quick local deals",
    refresh: "Every 60s",
  },
  {
    name: "Kijiji",
    slug: "kijiji",
    tagline: "Canadian marketplace value",
    refresh: "Every 90s",
  },
  {
    name: "Gumtree",
    slug: "gumtree",
    tagline: "Hidden UK classifieds value",
    refresh: "Every 90s",
  },
  {
    name: "Nextdoor",
    slug: "nextdoor",
    tagline: "Hyperlocal neighborhood deals",
    refresh: "Every 120s",
  },
];
