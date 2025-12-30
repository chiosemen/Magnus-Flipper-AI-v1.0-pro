/**
 * Magnus Flipper Pricing Configuration
 * 
 * All pricing, features, and tier definitions.
 * Region-aware with UK (£) and US ($) support.
 */

export type PricingTier = "free" | "pro" | "elite" | "mma";

export type TierConfig = {
  id: PricingTier;
  name: string;
  tagline: string;
  description: string;
  price: {
    uk: number;
    us: number;
  };
  billingPeriod: "month";
  scansPerDay: number | "unlimited";
  features: string[];
  highlights: string[];
  isPopular?: boolean;
  badge?: string;
};

export const PRICING_TIERS: Record<PricingTier, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Get started",
    description: "Perfect for exploring Magnus Flipper and occasional searches.",
    price: { uk: 0, us: 0 },
    billingPeriod: "month",
    scansPerDay: 10,
    features: [
      "10 scans per day",
      "3 marketplaces",
      "Basic search results",
      "Recent listings badge",
    ],
    highlights: [
      "No credit card required",
      "Instant access",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For active flippers",
    description: "Daily scanning with alerts and full usage visibility.",
    price: { uk: 55, us: 69 },
    billingPeriod: "month",
    scansPerDay: 100,
    features: [
      "100 scans per day",
      "All marketplaces",
      "Deal alerts",
      "Usage dashboard",
      "Verified badge access",
      "Email notifications",
    ],
    highlights: [
      "Most popular for individuals",
      "Cancel anytime",
    ],
    isPopular: true,
    badge: "Most Popular",
  },
  elite: {
    id: "elite",
    name: "Elite",
    tagline: "For serious operators",
    description: "Higher caps, priority processing, and advanced filters.",
    price: { uk: 105, us: 129 },
    billingPeriod: "month",
    scansPerDay: 500,
    features: [
      "500 scans per day",
      "All marketplaces",
      "Priority scan processing",
      "Advanced filters",
      "Live Capture badge",
      "Deal Score explanations",
      "Bulk export",
    ],
    highlights: [
      "5x higher daily cap",
      "Faster results",
    ],
  },
  mma: {
    id: "mma",
    name: "Magnus Market Agent",
    tagline: "Autonomous observation",
    description: "Maximum throughput with agent workflows for professional operators.",
    price: { uk: 160, us: 199 },
    billingPeriod: "month",
    scansPerDay: "unlimited",
    features: [
      "Unlimited scans",
      "All marketplaces",
      "Agent workflows",
      "Auto-refresh (15-120s)",
      "Full freshness indicators",
      "Verified + Live Capture",
      "Priority concurrency",
      "Dedicated console",
      "API access",
    ],
    highlights: [
      "Best for professionals",
      "Maximum throughput",
    ],
    badge: "Best Value",
  },
};

export const TIER_ORDER: PricingTier[] = ["free", "pro", "elite", "mma"];

/**
 * Feature comparison matrix for the pricing table.
 */
export type FeatureRow = {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  elite: string | boolean;
  mma: string | boolean;
  tooltip?: string;
};

export const FEATURE_COMPARISON: FeatureRow[] = [
  {
    name: "Daily scans",
    free: "10",
    pro: "100",
    elite: "500",
    mma: "Unlimited",
  },
  {
    name: "Marketplaces",
    free: "3",
    pro: "All",
    elite: "All",
    mma: "All",
  },
  {
    name: "Search results",
    free: "Basic",
    pro: "Full",
    elite: "Full + Priority",
    mma: "Full + Priority",
  },
  {
    name: "Deal alerts",
    free: false,
    pro: true,
    elite: true,
    mma: true,
    tooltip: "Get notified when new deals match your criteria.",
  },
  {
    name: "Usage dashboard",
    free: false,
    pro: true,
    elite: true,
    mma: true,
    tooltip: "Track your daily and monthly usage in real time.",
  },
  {
    name: "Verified badge",
    free: false,
    pro: true,
    elite: true,
    mma: true,
    tooltip: "Listings verified against source data.",
  },
  {
    name: "Live Capture",
    free: false,
    pro: false,
    elite: true,
    mma: true,
    tooltip: "Real-time capture from live marketplace sessions.",
  },
  {
    name: "Advanced filters",
    free: false,
    pro: false,
    elite: true,
    mma: true,
    tooltip: "Filter by condition, seller rating, location radius.",
  },
  {
    name: "Auto-refresh",
    free: false,
    pro: false,
    elite: false,
    mma: "15-120s",
    tooltip: "Automatic refresh at configurable intervals.",
  },
  {
    name: "Agent workflows",
    free: false,
    pro: false,
    elite: false,
    mma: true,
    tooltip: "Set up autonomous market observation agents.",
  },
  {
    name: "API access",
    free: false,
    pro: false,
    elite: false,
    mma: true,
    tooltip: "Programmatic access to Magnus API.",
  },
];

/**
 * FAQ content for pricing page.
 */
export type FAQItem = {
  question: string;
  answer: string;
};

export const PRICING_FAQ: FAQItem[] = [
  {
    question: "What exactly does Magnus Flipper do?",
    answer: "Magnus Flipper searches multiple online marketplaces simultaneously from a single interface. Instead of opening separate tabs for eBay, Facebook Marketplace, Gumtree, and Vinted, you search once and see normalized, deduplicated results ranked by relevance. This saves hours of manual searching and helps you spot deals faster.",
  },
  {
    question: "How is this different from other monitoring tools?",
    answer: "Magnus Flipper uses the Magnus API to provide real-time, unified search across marketplaces. Results include freshness badges showing how recently each listing was verified, so you know which deals are still available. We focus on speed and accuracy rather than feature bloat.",
  },
  {
    question: "Why are there usage limits?",
    answer: "Each scan consumes resources to fetch and process live marketplace data. Limits ensure fair access for all users and maintain system reliability. Higher tiers unlock higher throughput for users who need more volume. You can always see your current usage in the dashboard.",
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Yes. You can change your plan at any time from your account settings. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period.",
  },
  {
    question: "What happens if I hit my daily limit?",
    answer: "When you reach your daily scan limit, new searches will be paused until the next day (midnight UTC). You will not be charged extra. Your existing results remain accessible. Consider upgrading if you regularly hit your limit.",
  },
  {
    question: "Is my data private?",
    answer: "Yes. Your searches and saved deals are private to your account. We do not sell or share your data with third parties. Search queries are processed in real time and not stored beyond what is needed for your session.",
  },
  {
    question: "Do prices change by region?",
    answer: "Prices are shown in your local currency (£ for UK, $ for US) for convenience. The actual charge is processed in the currency shown at checkout. Prices are equivalent across regions after currency conversion.",
  },
];

/**
 * Value propositions for the hero section.
 */
export const VALUE_PROPOSITIONS = {
  unifiedSearch: {
    title: "Unified Cross-Market Search",
    description: "Search multiple marketplaces from one interface. Results are normalized, deduplicated, and ranked so you can find deals faster than switching between tabs.",
    points: [
      "One search, all marketplaces",
      "Deduplicated results",
      "Smart ranking",
    ],
  },
  freshnessBadges: {
    title: "Freshness Badges",
    description: "Every listing shows how recently it was observed. Know at a glance which deals are fresh and which might already be gone.",
    badges: [
      { name: "Verified", description: "Enriched and validated by Magnus systems" },
      { name: "Live Capture", description: "Captured from a live marketplace session moments ago" },
      { name: "Recent", description: "Recently observed listing, still relevant" },
    ],
  },
  usageMeter: {
    title: "Transparent Usage",
    description: "Always know where you stand. Your usage dashboard shows scans remaining, daily limits, and when your allowance resets.",
    points: [
      "Real-time usage tracking",
      "Clear daily limits",
      "No surprise charges",
    ],
  },
};

