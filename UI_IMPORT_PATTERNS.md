# UI Package Import Patterns

## Correct Import Pattern

The `@magnus-flipper-ai/ui` package uses **barrel exports**. Always import from the barrel, not from individual component files.

### ✅ Correct

```typescript
// Import from barrel exports
import { Button, Card } from "@magnus-flipper-ai/ui/components";
import { ThemeProvider } from "@magnus-flipper-ai/ui/providers";
```

### ❌ Incorrect

```typescript
// DO NOT import individual component files
import { Button } from "@magnus-flipper-ai/ui/components/Button";
import { Card } from "@magnus-flipper-ai/ui/components/Card";
```

## Why?

The package.json exports are configured as barrel exports:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./components": "./components/index.ts",
    "./providers": "./providers/index.ts",
    "./theme": "./theme/tokens.ts",
    "./tailwind-preset": "./tailwind-preset.js",
    "./*": "./src/*"
  }
}
```

- `"./components"` points to `"./components/index.ts"` (barrel export)
- `"./providers"` points to `"./providers/index.ts"` (barrel export)

The wildcard pattern `"./*": "./src/*"` does NOT include the `components/` directory, so individual component imports won't resolve.

## Available Imports

### Components

```typescript
import { 
  Button, 
  Card, 
  Input, 
  Badge, 
  Text,
  Section,
  // Motion components
  FadeIn,
  SlideUp
} from "@magnus-flipper-ai/ui/components";
```

### Providers

```typescript
import { ThemeProvider, useTheme } from "@magnus-flipper-ai/ui/providers";
```

### Theme

```typescript
import { tokens } from "@magnus-flipper-ai/ui/theme";
```

### Utilities

```typescript
import { cn, buildVariant } from "@magnus-flipper-ai/ui/components";
```

## Fixing Existing Imports

If you encounter import errors, run the fix script:

```bash
bash tools/fix-ui-imports.sh
```

This will automatically convert all incorrect imports to use barrel exports.

## Next.js Configuration

Ensure `@magnus-flipper-ai/ui` is in `transpilePackages`:

```javascript
// apps/web/next.config.mjs
const nextConfig = {
  transpilePackages: [
    // ... other packages
    "@magnus-flipper-ai/ui"
  ]
};
```

## Build Verification

The workspace export verification runs before builds:

```bash
pnpm verify:exports
```

This ensures all package exports are valid before attempting to build.
