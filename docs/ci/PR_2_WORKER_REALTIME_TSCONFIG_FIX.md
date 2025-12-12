# PR #2: worker-realtime tsconfig.json Normalization

## Objective
Fix inconsistent `rootDir` configuration in worker-realtime to match other workers.

## Files Changed

### 1. `apps/worker-realtime/tsconfig.json`

```diff
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ES2022",
      "moduleResolution": "node",
-     "rootDir": "../..",
+     "rootDir": "./src",
      "baseUrl": ".",
      "paths": {
        "@magnus-flipper-ai/core": ["../../packages/core/src/index.ts"],
        "@magnus-flipper-ai/core/*": ["../../packages/core/src/*"],
        "@magnus-flipper-ai/rate-limiter": ["../../packages/rate-limiter/src/index.ts"],
        "@magnus-flipper-ai/rate-limiter/*": ["../../packages/rate-limiter/src/*"],
        "@magnus-flipper-ai/marketplace-config": ["../../packages/marketplace-config/src/index.ts"],
        "@magnus-flipper-ai/marketplace-config/*": ["../../packages/marketplace-config/src/*"],
        "@magnus-flipper-ai/compliance-shield": ["../../packages/compliance-shield/src/index.ts"],
        "@magnus-flipper-ai/compliance-shield/*": ["../../packages/compliance-shield/src/*"]
      },
-     "typeRoots": ["./src/types", "../../node_modules/@types"],
+     "typeRoots": ["../../node_modules/@types", "./src/types"],
      "outDir": "./dist",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
```

## Validation Steps

1. **TypeScript Build**:
   ```bash
   pnpm --filter @magnus-flipper-ai/worker-realtime build
   ```
   Expected: ✅ No errors, build succeeds

2. **Verify Output Structure**:
   ```bash
   ls -la apps/worker-realtime/dist/
   ```
   Expected: ✅ `dist/index.js` exists and is valid

3. **Check for Path Import Regressions**:
   - Verify all workspace package imports still resolve
   - Check that typeRoots still work for custom types

4. **CI Verification**:
   - PR must pass `ci-invariant.yml` workflow
   - No DeployGuardian validation (still disabled)

## Risk Assessment

- **Risk Level**: MEDIUM
- **Impact if Fails**: worker-realtime build may break
- **Rollback**: Revert tsconfig.json change

## Notes

- This change normalizes worker-realtime to match worker-scheduler pattern
- The `rootDir: "../.."` was unusual and may cause issues with Docker builds
- Path mappings should still work as they're relative to `baseUrl: "."`
- TypeRoots order adjusted to prioritize node_modules (standard practice)

## Potential Issues

If build fails after this change:
1. Check if any imports rely on `rootDir: "../.."` structure
2. Verify path mappings still resolve correctly
3. Ensure typeRoots still finds custom type definitions

