import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {
    root: resolve(__dirname, '../..'),
  },
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
  transpilePackages: [
    "@magnus-flipper-ai/core",
    "@magnus-flipper-ai/agentic-engine",
    "@magnus-flipper-ai/arb-engine",
    "@magnus-flipper-ai/compliance-shield",
    "@magnus-flipper-ai/deal-engine",
    "@magnus-flipper-ai/feed-engine",
    "@magnus-flipper-ai/profit-engine",
    "@magnus-flipper-ai/scraper-sync",
    "@magnus-flipper-ai/shipping-engine",
    "@magnus-flipper-ai/ui"
  ]
};

export default nextConfig;
