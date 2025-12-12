# Design Tokens Directory

This directory contains design tokens exported from Figma.

## Files

- `figma-tokens.json` - Complete design token system exported from Figma

## Usage

### Sync Figma tokens to code:

```bash
# Dry run (preview changes)
pnpm figma:sync --dry-run

# Apply changes
pnpm figma:sync

# Force apply (bypasses safety checks)
pnpm figma:sync --force
```

### Compare Figma tokens with code:

```bash
# Generate drift report
pnpm figma:compare

# Generate report and apply fixes
pnpm figma:fix

# Strict mode (exits with error if critical issues found)
pnpm figma:compare --strict
```

## Token Categories

The Figma tokens JSON should contain:

- `colors` - Color palette (dark/light themes, semantic, chart, traffic)
- `typography` - Font families, sizes, weights, line heights
- `spacing` - Spacing scale and semantic spacing tokens
- `radius` - Border radius values
- `shadows` - Shadow definitions
- `transitions` - Transition durations
- `gradients` - Gradient definitions (optional)

## Output Files

The sync script generates/updates:

- `packages/ui/theme/tokens.ts` - TypeScript token definitions
- `packages/ui/theme/plugin.ts` - Tailwind plugin (requires manual update)
- `packages/ui/tailwind-preset.js` - Tailwind preset (requires manual update)

## Safety Features

- **Dry run mode**: Preview changes without applying
- **Change detection**: Warns if >50 tokens would change
- **Force flag**: Required for large changes
- **Drift detection**: Compares Figma vs code before syncing

## Notes

- The sync script only updates `tokens.ts` automatically
- `plugin.ts` and `tailwind-preset.js` need manual updates after token changes
- Always review the drift report before applying fixes
- Backup your tokens before running sync in production
