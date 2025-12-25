/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },
};

export default nextConfig;
