# Build Process Documentation

## Overview

The Magnus Flipper AI monorepo uses a workspace structure with multiple packages and apps. The web application depends on built packages, so packages must be built before building the web app.

## Prerequisites

- Node.js 20+
- pnpm 9.15.4+
- All environment variables configured (see `.env.example`)

## Build Order

The build process follows this order:

1. **Build all packages** (`@magnus-flipper-ai/*`)
2. **Build web application** (`apps/web`)

## Build Commands

### Build Everything

```bash
# Build all packages and apps (uses turbo)
pnpm build
```

### Build Packages Only

```bash
# Build all @magnus-flipper-ai/* packages
pnpm build:packages
```

### Build Web App (Recommended)

```bash
# Builds packages first, then web app
pnpm build:web
```

### Build Individual Packages

```bash
# Build specific package
pnpm --filter @magnus-flipper-ai/shipping-engine build
pnpm --filter @magnus-flipper-ai/scraper-sync build
pnpm --filter @magnus-flipper-ai/profit-engine build
pnpm --filter @magnus-flipper-ai/agentic-engine build
pnpm --filter @magnus-flipper-ai/deal-engine build
```

### Build Web App Only (After Packages Built)

```bash
pnpm --filter web build
```

## Required Packages

The following packages must be built before building the web app:

- `@magnus-flipper-ai/shipping-engine`
- `@magnus-flipper-ai/scraper-sync`
- `@magnus-flipper-ai/profit-engine`
- `@magnus-flipper-ai/agentic-engine`
- `@magnus-flipper-ai/deal-engine`
- `@magnus-flipper-ai/arb-engine`

## CI/CD Build Process

For CI/CD pipelines, use:

```bash
# Install dependencies
pnpm install

# Build packages first
pnpm build:packages

# Build web app
pnpm --filter web build

# Or use the combined command
pnpm build:web
```

## Type Checking

```bash
# Type check web app
pnpm --filter web typecheck

# Type check all packages
pnpm --filter '@magnus-flipper-ai/*' typecheck
```

## Common Issues

### Module Not Found Errors

If you see errors like:
```
Module not found: Can't resolve '@magnus-flipper-ai/shipping-engine/...'
```

**Solution:** Build the packages first:
```bash
pnpm build:packages
```

### Import Resolution Errors

If imports fail with `.js` extension errors, ensure:
1. Packages are built (`pnpm build:packages`)
2. Next.js config includes `transpilePackages` (already configured)

### Build Cache Issues

Clear build cache if needed:
```bash
# Clear turbo cache
pnpm turbo clean

# Clear Next.js cache
cd apps/web && rm -rf .next
```

## Development

For development, packages are built automatically via turbo:

```bash
pnpm dev
```

This will watch and rebuild packages as needed.

## Production Deployment

For production builds on Vercel or similar:

1. Ensure build command is: `pnpm build:web`
2. Or configure build steps:
   - Install: `pnpm install`
   - Build packages: `pnpm build:packages`
   - Build web: `pnpm --filter web build`

## Verification

After building, verify the build:

```bash
# Check web build output
ls -la apps/web/.next

# Check package dist folders
ls -la packages/*/dist
```

