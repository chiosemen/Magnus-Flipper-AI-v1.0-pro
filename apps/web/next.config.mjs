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
    "@magnus-flipper-ai/queue",
    "@magnus-flipper-ai/scrapers",
    "@magnus-flipper-ai/shipping-engine",
    "@magnus-flipper-ai/ui"
  ],
  // v1 build surface control
  typescript: {
    ignoreBuildErrors: false, // Keep strict - we fixed the real issues
  },
  // Exclude API routes from build (v1 - MM Agent only)
  // API routes import Prisma at module level and fail during build
  // They'll be re-enabled in v2 with proper lazy loading
};

export default nextConfig;
