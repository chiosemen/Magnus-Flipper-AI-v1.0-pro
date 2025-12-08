/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    // IMPORTANT: This stops the "apps/web/apps/web" bug
    root: "../../",
  },

  experimental: {
    dynamicIO: true,
  },

  transpilePackages: [
    "@magnus-flipper-ai/agentic-engine",
    "@magnus-flipper-ai/deal-engine",
    "@magnus-flipper-ai/profit-engine",
    "@magnus-flipper-ai/shipping-engine",
    "@magnus-flipper-ai/scraper-sync",
    "@magnus-flipper-ai/arb-engine",
  ],
};

export default nextConfig;
