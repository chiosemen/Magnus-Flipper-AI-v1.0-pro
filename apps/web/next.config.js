/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@magnus-flipper-ai/core",
    "@magnus-flipper-ai/ui",
    "@magnus-flipper-ai/ui-config"
  ]
};

module.exports = nextConfig;
