/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {},
  turbopack: {
    root: "../../",
  },
  transpilePackages: [
    "@magnus-flipper-ai/core",
    "@magnus-flipper-ai/agentic-engine",
    "@magnus-flipper-ai/arb-engine",
    "@magnus-flipper-ai/deal-engine",
    "@magnus-flipper-ai/scraper-sync",
    "@magnus-flipper-ai/profit-engine",
    "@magnus-flipper-ai/shipping-engine",
  ],
};

export default nextConfig;
