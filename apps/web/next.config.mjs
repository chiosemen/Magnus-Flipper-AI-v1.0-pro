import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Ensure dynamic rendering (NO static export)
  output: undefined, // explicitly not 'export'

  // Turbopack configuration for monorepo
  experimental: {
    turbo: {
      root: __dirname,
    },
    // Ensure dynamic routes work correctly
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Transpile monorepo packages
  transpilePackages: [
    "@magnus-flipper-ai/agentic-engine",
    "@magnus-flipper-ai/deal-engine",
    "@magnus-flipper-ai/profit-engine",
    "@magnus-flipper-ai/shipping-engine",
    "@magnus-flipper-ai/scraper-sync",
    "@magnus-flipper-ai/arb-engine",
  ],

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
