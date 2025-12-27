import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.config.*',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: [
      // Specific aliases first (exact matches)
      {
        find: '@magnus/deploy-guardian-contracts',
        replacement: path.resolve(
          __dirname,
          '../../packages/deploy-guardian-contracts/dist'
        ),
      },
      { find: '@/app', replacement: path.resolve(__dirname, './app') },
      { find: '@/src', replacement: path.resolve(__dirname, './src') },
      { find: '@/lib', replacement: path.resolve(__dirname, './lib') },
      { find: '@/components', replacement: path.resolve(__dirname, './components') },
      { find: '@/types', replacement: path.resolve(__dirname, './types') },
      { find: '@/providers', replacement: path.resolve(__dirname, './providers') },
      { find: '@/marketing-swoopa', replacement: path.resolve(__dirname, './marketing-swoopa') },
      // General @/* alias - matches tsconfig.json: tries app/* first, then src/*
      // Using regex to match @/... but not @/app, @/src, etc. (already handled above)
      { 
        find: /^@\/(?!app\/|src\/|lib\/|components\/|types\/|providers\/)(.*)$/, 
        replacement: path.resolve(__dirname, './app/$1') 
      },
    ],
  },
});
