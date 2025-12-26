/** @type {import('next').NextConfig} */
const path = require('path');

module.exports = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },
};
