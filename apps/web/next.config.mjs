/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile monorepo packages
  transpilePackages: [
    '@magnus-flipper-ai/agentic-engine',
    '@magnus-flipper-ai/deal-engine',
    '@magnus-flipper-ai/profit-engine',
    '@magnus-flipper-ai/shipping-engine',
    '@magnus-flipper-ai/scraper-sync',
    '@magnus-flipper-ai/arb-engine',
  ],
  
  // Removed experimental block (caused production SSR failures)
};

export default nextConfig;
