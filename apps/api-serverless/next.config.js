/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@magnus-flipper-ai/core',
    '@magnus-flipper-ai/shared',
  ],
  // Optimize for serverless
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Disable image optimization for API-only app
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
