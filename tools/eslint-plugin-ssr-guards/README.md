# eslint-plugin-ssr-guards

> ESLint rules for Next.js App Router SSR safety

Reusable ESLint plugin that prevents common SSR violations in Next.js App Router applications.

## Rules

### `ssr-guards/no-hooks-in-error-boundaries`

**Type**: Problem  
**Recommended**: Yes

Disallows React hooks in Next.js App Router error boundaries (`error.tsx`, `global-error.tsx`).

**Why**: Error boundaries render before providers exist. Using hooks causes:
```
TypeError: Cannot read properties of null (reading 'useContext')
```
during SSR/prerender, breaking production builds.

**❌ Incorrect:**

```tsx
// apps/web/app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <div>Error</div>;
}
```

**✅ Correct:**

```tsx
// apps/web/app/error.tsx
'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{ padding: 32 }}>
      <h1>Something went wrong</h1>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Installation

This is a local plugin (not published to npm). No installation needed.

## Configuration

### Next.js App (apps/web/.eslintrc.json)

```json
{
  "plugins": ["ssr-guards"],
  "rules": {
    "ssr-guards/no-hooks-in-error-boundaries": "error"
  }
}
```

### ESLint Config (JavaScript)

```js
// .eslintrc.js
module.exports = {
  plugins: ["ssr-guards"],
  rules: {
    "ssr-guards/no-hooks-in-error-boundaries": "error",
  },
};
```

## Usage with pnpm Workspace

In the root `.eslintrc.json` or `apps/web/.eslintrc.json`:

```json
{
  "plugins": ["ssr-guards"],
  "rules": {
    "ssr-guards/no-hooks-in-error-boundaries": "error"
  }
}
```

ESLint will automatically resolve the plugin from `tools/eslint-plugin-ssr-guards`.

## Detected Patterns

The rule detects:
- ✅ Hook calls: `useState()`, `useEffect()`, `useContext()`, etc.
- ✅ Hook imports: `import { useState } from 'react'`
- ✅ Custom hooks: Any function matching `/^use[A-Z]/`

Files checked:
- `**/global-error.tsx`
- `**/global-error.jsx`
- `**/_global-error/**/*`
- `**/error.tsx`
- `**/error.jsx`

## Error Message

When a violation is detected:

```
❌ HOOKS FORBIDDEN: 'useEffect' cannot be used in App Router error boundaries.
Error boundaries render before providers exist and will crash during SSR/prerender.
Use static JSX + inline styles only. See ERROR_BOUNDARY_RULES.md for details.
```

## Cross-Repo Reusability

This plugin can be copied to any Next.js App Router monorepo:

1. Copy `tools/eslint-plugin-ssr-guards/` to new repo
2. Add to ESLint config (as shown above)
3. No npm dependencies required

## Related Documentation

- [ERROR_BOUNDARY_RULES.md](../../ERROR_BOUNDARY_RULES.md) - Complete error boundary guidelines
- [Next.js Error Handling Docs](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

## License

MIT

