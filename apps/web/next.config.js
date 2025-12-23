/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        '@magnus-flipper-ai/tech-trade-core':
          '../../packages/tech-trade-core/dist/index.js',
      },
    },
  },

  transpilePackages: [
    '@magnus-flipper-ai/tech-trade-core',
    '@magnus-flipper-ai/ui',
    '@magnus-flipper-ai/core',
  ],
};

module.exports = nextConfig;
