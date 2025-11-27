export const DEMO_ALERTS = [
  {
    id: "demo-a1",
    savedSearchId: "demo-s1",
    listingId: "demo-l1",
    matchedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    notified: true,
    listing: {
      site: "FB_MARKETPLACE",
      city: "Brooklyn",
    },
  },
  {
    id: "demo-a2",
    savedSearchId: "demo-s2",
    listingId: "demo-l2",
    matchedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    notified: true,
    listing: {
      site: "OFFERUP",
      city: "Los Angeles",
    },
  },
];
