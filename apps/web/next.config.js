/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@magnus-flipper-ai/core',
    '@magnus-flipper-ai/ui',
    '@magnus-flipper-ai/ui-config',
    '@magnus-flipper-ai/sdk',
    '@magnus-flipper-ai/shared',
  ],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
}

module.exports = nextConfig
