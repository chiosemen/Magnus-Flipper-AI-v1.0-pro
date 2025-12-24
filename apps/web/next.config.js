const path = require('path');

const nextConfig = {
  transpilePackages: [
    "@magnus-flipper-ai/ui",
    "@magnus-flipper-ai/core",
  ],
  // CRITICAL: Force Next.js to use THIS directory as root
  // Prevents monorepo workspace root mis-detection
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
};

module.exports = nextConfig;
