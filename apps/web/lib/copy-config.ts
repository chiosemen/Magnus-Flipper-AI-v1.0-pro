import type { AppRegion } from "./appRegion";

export type RegionCopy = {
  heroSubtitle: string;
  heroMarketplacesLabel: string;
  heroSampleDealTitle: string;
  howItWorksExamples: string;
  howItWorksAlertsLine: string;
  ctaHeading: string;
  ctaBody: string;
  ctaTrustLine: string;
  testimonialsHeading: string;
  supportPromise: string;
};

export const REGION_COPY: Record<AppRegion, RegionCopy> = {
  US: {
    heroSubtitle:
      "Magnus Flipper monitors Facebook Marketplace, Craigslist, and OfferUp in real-time so you can message sellers before anyone else even sees the listing.",
    heroMarketplacesLabel: "DOMINATE WITH MAGNUS FLIPPER",
    heroSampleDealTitle: "Toyota Camry GLE",
    howItWorksExamples: 'Choose keywords like "Tacoma 4×4," "Silverado," or "PS5."',
    howItWorksAlertsLine:
      "Faster markets reward speed — get alerts the moment a match hits the pooled feed.",
    ctaHeading: "Get AI Deal Alerts so you can contact sellers within seconds",
    ctaBody:
      "Forget hopping between Facebook Marketplace, Craigslist, and OfferUp. Magnus Flipper pulls pooled listings into one reliable feed and highlights the best opportunities first.",
    ctaTrustLine: "Join thousands of flippers who never miss a deal",
    testimonialsHeading: "Close the deal before your competition even sees it",
    supportPromise:
      "Need help dialing in searches? We’ll help you tune filters and reduce noise so you move fast on the right deals.",
  },
  UK: {
    heroSubtitle:
      "Magnus Flipper monitors Facebook Marketplace, Gumtree, and eBay so you get smarter alerts with less noise — focused on value, not spam.",
    heroMarketplacesLabel: "FIND VALUE WITH MAGNUS FLIPPER",
    heroSampleDealTitle: "Volkswagen Golf GTD",
    howItWorksExamples: 'Choose keywords like "Golf GTI," "Fiesta," or "PS5."',
    howItWorksAlertsLine:
      "UK markets move a bit slower — wider windows, smarter filtering, and fewer low-quality pings.",
    ctaHeading: "Get smarter deal alerts — without the noise",
    ctaBody:
      "Forget hopping between Facebook Marketplace, Gumtree, and eBay. Magnus Flipper pulls pooled listings into one reliable feed and filters out the noise.",
    ctaTrustLine: "Join flippers across the UK who never miss the best listings",
    testimonialsHeading: "Be first to the good listings — without living in your browser",
    supportPromise:
      "Need help optimizing searches? We’ll suggest anti-keywords and filters so your feed stays clean and high-signal.",
  },
};

export function copyForRegion(region: AppRegion): RegionCopy {
  return REGION_COPY[region];
}
