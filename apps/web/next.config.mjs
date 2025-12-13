/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  transpilePackages: [
    "@magnus-flipper-ai/core",
    "@magnus-flipper-ai/agentic-engine",
    "@magnus-flipper-ai/arb-engine",
    "@magnus-flipper-ai/deal-engine",
    "@magnus-flipper-ai/profit-engine",
    "@magnus-flipper-ai/scraper-sync",
    "@magnus-flipper-ai/shipping-engine",
    "@magnus-flipper-ai/ui"
  ]
};

export default nextConfig;
