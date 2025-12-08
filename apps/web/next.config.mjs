import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    // no dynamicIO here
  },
  turbopack: {
    // use absolute root for monorepo
    root: resolve(__dirname, '../..'),
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
