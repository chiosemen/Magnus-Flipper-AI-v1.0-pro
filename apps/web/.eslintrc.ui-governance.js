/**
 * ESLint Rules for UI Governance
 *
 * Enforces the Never-Disappear UI Contract:
 * - Sections always render via SectionShell
 * - Images use SafeImage, not next/image directly
 * - Feature flags use FeatureGate, not conditional rendering
 *
 * To enable, merge this into your main .eslintrc.js
 */

module.exports = {
  rules: {
    /**
     * RULE 1: Block direct next/image imports
     *
     * All images must go through SafeImage for:
     * - Centralized URL resolution (protocol-relative, null handling)
     * - Consistent error handling
     * - Fallback rendering
     */
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'next/image',
            message:
              'Use @/components/ui/SafeImage instead of next/image directly. ' +
              'This ensures centralized image error handling and URL resolution. ' +
              'See apps/web/UI_FREEZE_CONTRACT.md for details.',
          },
        ],
      },
    ],

    /**
     * RULE 2: Require alt text on all images
     *
     * Benefits:
     * - Accessibility (screen readers)
     * - Debugging (shows when image fails)
     * - SEO
     */
    'jsx-a11y/alt-text': [
      'error',
      {
        elements: ['img', 'object', 'area', 'input[type="image"]'],
        img: ['Image', 'SafeImage'],
      },
    ],

    /**
     * RULE 3: Warn on dangerous conditional rendering
     *
     * Pattern: {data && <Component />}
     * Problem: Component disappears when data is falsy
     *
     * Note: This is a heuristic, false positives possible
     */
    'no-restricted-syntax': [
      'warn',
      {
        selector:
          'JSXExpressionContainer > LogicalExpression[operator="&&"]' +
          '[right.type="JSXElement"][right.openingElement.name.name=/Section$/]',
        message:
          'Avoid conditional rendering of section-level components. ' +
          'Use SectionShell to ensure sections always render. ' +
          'See apps/web/UI_FREEZE_CONTRACT.md#forbidden-patterns',
      },
    ],

    /**
     * RULE 4: Warn on useEffect missing deps (can cause stale closures)
     *
     * Indirect UI governance: prevents bugs where sections show stale data
     */
    'react-hooks/exhaustive-deps': 'warn',
  },

  overrides: [
    /**
     * EXCEPTION 1: SafeImage.tsx itself can import next/image
     */
    {
      files: ['**/SafeImage.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },

    /**
     * EXCEPTION 2: Static marketing pages with hardcoded image paths
     *
     * Rationale: /public assets are build-time validated, low risk
     *
     * To use this exception, add this comment above the import:
     * // eslint-disable-next-line no-restricted-imports -- static asset
     */
    {
      files: ['**/marketing-swoopa/**/*.tsx'],
      rules: {
        'no-restricted-imports': [
          'warn', // Downgrade to warning for marketing pages
          {
            paths: [
              {
                name: 'next/image',
                message:
                  'Prefer SafeImage even for static assets. ' +
                  'If using static /public path, add comment: ' +
                  '// eslint-disable-next-line no-restricted-imports -- static asset',
              },
            ],
          },
        ],
      },
    },

    /**
     * EXCEPTION 3: Low-level UI components (primitives)
     *
     * These can use conditional rendering and return null:
     * - Tooltips, popovers, modals
     * - Form field helpers
     * - Chart internals
     */
    {
      files: [
        '**/components/ui/**/*.tsx',
        '**/components/flipbomb/ui/**/*.tsx',
        '**/marketing-swoopa/components/ui/**/*.tsx',
      ],
      rules: {
        'no-restricted-syntax': 'off', // Allow conditional rendering in primitives
      },
    },
  ],
};
