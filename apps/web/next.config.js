/** @type {import('next').NextConfig} */
const path = require('path');

module.exports = {
  output: 'standalone',
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },
};
