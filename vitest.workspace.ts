import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './apps/api/vitest.config.ts',
    test: {
      name: 'api',
      include: ['apps/api/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
  },
  {
    extends: './apps/web/vitest.config.ts',
    test: {
      name: 'web',
      include: ['apps/web/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
  },
]);

