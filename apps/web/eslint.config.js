const nextConfig = require('eslint-config-next');

const errorBoundaryRules = {
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.name=/^use[A-Z]/]",
      message:
        '❌ HOOKS FORBIDDEN: React hooks are not allowed in App Router error boundaries. Error boundaries render before providers exist and will crash during SSR/prerender if hooks are used. This file must be SSR-pure with static JSX only.',
    },
    {
      selector: "CallExpression[callee.name='useContext']",
      message:
        "❌ useContext FORBIDDEN: Error boundaries render before context providers exist. This will cause 'Cannot read properties of null (reading useContext)' during build. Use static JSX only.",
    },
    {
      selector: "CallExpression[callee.name='useState']",
      message:
        '❌ useState FORBIDDEN: State hooks cannot be used in error boundaries during SSR. Keep error boundaries stateless with pure JSX.',
    },
    {
      selector: "CallExpression[callee.name='useEffect']",
      message:
        '❌ useEffect FORBIDDEN: Effect hooks run during SSR in error boundaries and will crash. Use pure JSX only, no side effects.',
    },
    {
      selector: "CallExpression[callee.name='useRouter']",
      message:
        "❌ useRouter FORBIDDEN: Router hooks require Next.js runtime context that doesn't exist in error boundaries during prerender.",
    },
    {
      selector: "CallExpression[callee.name='usePathname']",
      message:
        '❌ usePathname FORBIDDEN: Navigation hooks require runtime context. Use static JSX in error boundaries.',
    },
    {
      selector: "CallExpression[callee.name='useSearchParams']",
      message:
        '❌ useSearchParams FORBIDDEN: Navigation hooks require runtime context. Use static JSX in error boundaries.',
    },
    {
      selector: "CallExpression[callee.name='useTheme']",
      message:
        "❌ useTheme FORBIDDEN: Theme hooks require ThemeProvider context that doesn't exist in error boundaries.",
    },
  ],
};

module.exports = [
  ...nextConfig,
  {
    files: [
      '**/app/**/error.tsx',
      '**/app/**/global-error.tsx',
      '**/app/**/_global-error/**/*.tsx',
    ],
    rules: errorBoundaryRules,
  },
];
