/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@magnus-flipper-ai/core",
    "@magnus-flipper-ai/ui",
    "@magnus-flipper-ai/ui-config",
    "@magnus-flipper-ai/shared",
    "@magnus-flipper-ai/queue",
    "@magnus-flipper-ai/fb-marketplace-crawler",
    "@magnus-flipper-ai/notifications",
    "@magnus-flipper-ai/sniper-engine",
    "@magnus-flipper-ai/valuation-engine"
  ]
};

export default nextConfig;
