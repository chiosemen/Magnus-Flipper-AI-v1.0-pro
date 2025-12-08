/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    // Critical fix — prevents the apps/web/apps/web bug
    root: "../../"
  },
  transpilePackages: [
    "@magnus-flipper-ai/agentic-engine",
    "@magnus-flipper-ai/deal-engine",
    "@magnus-flipper-ai/profit-engine",
    "@magnus-flipper-ai/shipping-engine",
    "@magnus-flipper-ai/scraper-sync",
    "@magnus-flipper-ai/arb-engine",
  ],
  experimental: {
    dynamicIO: true
  }
};

export default nextConfig;
