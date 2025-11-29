/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@magnus-flipper-ai/core",
    "@magnus-flipper-ai/ui",
    "@magnus-flipper-ai/ui-config",
    "@magnus-flipper-ai/sdk",
    "@magnus-flipper-ai/shared"
  ]
};

module.exports = nextConfig;
