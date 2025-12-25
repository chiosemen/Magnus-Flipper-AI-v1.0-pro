/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Vercel deployment
  output: "standalone",
  
  // v1 build surface control
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  // Exclude _dashboard_off from Next.js file system scanning
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
