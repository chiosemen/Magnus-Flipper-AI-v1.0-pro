/** @type {import("next").NextConfig} */
const nextConfig = {
  // Ensure dynamic rendering (NO static export)
  output: undefined, // explicitly not 'export'

  // Transpile monorepo packages
  transpilePackages: [
    "@magnus-flipper-ai/agentic-engine",
    "@magnus-flipper-ai/deal-engine",
    "@magnus-flipper-ai/profit-engine",
    "@magnus-flipper-ai/shipping-engine",
    "@magnus-flipper-ai/scraper-sync",
    "@magnus-flipper-ai/arb-engine",
  ],

  // Disable static optimization for marketing pages
  experimental: {
    // Ensure dynamic routes work correctly
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Image optimization (required for dynamic)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
