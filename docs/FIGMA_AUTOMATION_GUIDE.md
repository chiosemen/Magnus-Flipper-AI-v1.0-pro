# 🚀 Figma-to-Code Automation Engine

Complete guide for syncing Figma design tokens to code automatically.

## Overview

The Figma Automation Engine consists of two main scripts:

1. **`scripts/figma-sync.ts`** - Converts Figma tokens JSON → TypeScript tokens
2. **`scripts/compare-figma-code.ts`** - Compares Figma vs code and detects drift

## Quick Start

### 1. Export Figma Tokens

Export your design tokens from Figma as JSON and save to:
```
design/figma-tokens.json
```

### 2. Compare Tokens (Preview Changes)

```bash
pnpm figma:compare
```

This generates a drift report showing:
- Missing tokens in code
- Mismatched token values
- Extra tokens in code (not in Figma)

### 3. Sync Tokens (Apply Changes)

```bash
# Dry run first (recommended)
pnpm figma:sync --dry-run

# Apply changes
pnpm figma:sync

# Force apply (bypasses safety checks for large changes)
pnpm figma:sync --force
```

## Script Details

### `figma-sync.ts`

**Purpose:** Converts Figma tokens JSON into TypeScript token files.

**Features:**
- ✅ Reads `design/figma-tokens.json`
- ✅ Converts colors, typography, spacing, radius, shadows, transitions
- ✅ Generates `packages/ui/theme/tokens.ts`
- ✅ Safety checks (warns on >50 token changes)
- ✅ Dry run mode for preview

**Usage:**
```bash
# Basic sync
ts-node scripts/figma-sync.ts

# Custom input file
ts-node scripts/figma-sync.ts --input path/to/tokens.json

# Dry run (preview only)
ts-node scripts/figma-sync.ts --dry-run

# Force apply (bypass safety checks)
ts-node scripts/figma-sync.ts --force
```

**Output:**
- Updates `packages/ui/theme/tokens.ts` with Figma values
- Logs summary of changes
- Warns if plugin.ts needs manual update

---

### `compare-figma-code.ts`

**Purpose:** Compares Figma tokens with code tokens and detects drift.

**Features:**
- ✅ Compares all token categories
- ✅ Generates detailed drift report
- ✅ Categorizes issues by severity (critical/high/medium/low)
- ✅ Can auto-fix issues (--fix flag)
- ✅ Strict mode for CI/CD (exits with error on critical issues)

**Usage:**
```bash
# Generate report only
ts-node scripts/compare-figma-code.ts --report

# Generate report and apply fixes
ts-node scripts/compare-figma-code.ts --fix

# Strict mode (fails on critical issues)
ts-node scripts/compare-figma-code.ts --strict

# Custom input file
ts-node scripts/compare-figma-code.ts --input design/custom-tokens.json
```

**Output:**
- Generates `TOKEN_DRIFT_REPORT.md`
- Console output with issue summary
- Exit code 1 if critical issues found (strict mode)

---

## Token Categories Supported

### ✅ Colors
- Semantic colors (success, warning, danger, info)
- Background colors (primary, secondary, tertiary, subtle, hover)
- Border colors (subtle, strong, focus)
- Text colors (primary, secondary, muted, inverse)
- Chart colors (blue, purple, orange, green, red, yellow)
- Traffic colors (stable, canary, split)

### ✅ Typography
- Headings (h1-h6)
- Body text (bodyL, bodyM, bodyS)
- Mono text (monoL, monoM, monoS)
- Font families, sizes, weights, line heights, letter spacing

### ✅ Spacing
- Scale tokens (0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)
- Semantic spacing (cardPadding, panelPadding, badgePadding, etc.)

### ✅ Radius
- Border radius tokens (sm, md, lg, xl, full, card)

### ✅ Shadows
- Shadow definitions (none, cardHover, modal, focus)

### ✅ Transitions
- Transition durations (fast, normal, slow)

### ⚠️ Gradients
- Currently preserved from existing code (not synced from Figma)
- Can be extended to support Figma gradient tokens

---

## Workflow Examples

### Example 1: First-Time Setup

```bash
# 1. Export tokens from Figma → design/figma-tokens.json

# 2. Compare to see what's different
pnpm figma:compare

# 3. Review the drift report
cat TOKEN_DRIFT_REPORT.md

# 4. Sync tokens
pnpm figma:sync --dry-run  # Preview
pnpm figma:sync            # Apply

# 5. Update plugin.ts and tailwind-preset.js manually
# (These files need manual updates after token changes)
```

### Example 2: Regular Sync (After Figma Updates)

```bash
# 1. Export updated tokens from Figma

# 2. Compare to see changes
pnpm figma:compare

# 3. If changes look good, sync
pnpm figma:sync

# 4. Test components visually
pnpm dev:web
```

### Example 3: CI/CD Integration

```bash
# In CI pipeline, check for drift
pnpm figma:compare --strict

# This will:
# - Generate drift report
# - Exit with code 1 if critical issues found
# - Fail the build if tokens are out of sync
```

---

## Safety Features

### 1. Dry Run Mode
Always preview changes before applying:
```bash
pnpm figma:sync --dry-run
```

### 2. Change Detection
Script warns if >50 tokens would change:
```
❌ ERROR: Too many changes detected (>50 tokens). Use --force to override.
```

### 3. Force Flag Required
For large changes, explicit `--force` flag required:
```bash
pnpm figma:sync --force
```

### 4. Strict Mode
In CI/CD, use `--strict` to fail on critical issues:
```bash
pnpm figma:compare --strict
```

---

## Limitations & Notes

### ⚠️ Manual Updates Required

After syncing tokens, these files need **manual updates**:

1. **`packages/ui/theme/plugin.ts`**
   - CSS variable mappings
   - Tailwind theme extensions
   - Plugin utilities

2. **`packages/ui/tailwind-preset.js`**
   - Tailwind preset configuration
   - Theme extensions

**Why?** These files contain logic beyond simple token values (CSS variable names, Tailwind config structure, etc.)

### 🔄 Recommended Workflow

1. Run `figma:sync` to update `tokens.ts`
2. Run `figma:compare` to verify changes
3. Manually update `plugin.ts` and `tailwind-preset.js` if needed
4. Test components visually
5. Commit changes

### 📝 Token Format Requirements

Figma tokens JSON should follow this structure:

```json
{
  "colors": {
    "dark": {
      "semantic": {
        "success": { "500": "#22C55E" },
        "warning": { "500": "#F59E0B" },
        "danger": { "500": "#EF4444" }
      },
      "background": {
        "primary": "#0D1117",
        "secondary": "#161B22"
      }
    }
  },
  "typography": {
    "headings": {
      "h1": {
        "fontFamily": "Inter",
        "fontSize": "32px",
        "fontWeight": 700,
        "lineHeight": "40px",
        "letterSpacing": "-0.5px"
      }
    }
  },
  "spacing": {
    "scale": {
      "0": "0px",
      "1": "4px",
      "2": "8px"
    },
    "semantic": {
      "cardPadding": "24px"
    }
  },
  "radius": {
    "sm": "6px",
    "md": "8px",
    "lg": "12px"
  },
  "shadows": {
    "cardHover": "0 4px 12px rgba(0, 0, 0, 0.15)",
    "focus": "0 0 0 2px rgba(88, 166, 255, 0.3)"
  }
}
```

---

## Troubleshooting

### Issue: "Figma tokens file not found"

**Solution:** Ensure `design/figma-tokens.json` exists, or specify custom path:
```bash
pnpm figma:sync --input path/to/tokens.json
```

### Issue: "Too many changes detected"

**Solution:** Review changes first, then use `--force` if intentional:
```bash
pnpm figma:compare  # Review
pnpm figma:sync --force  # Apply
```

### Issue: "Code tokens file not found"

**Solution:** Ensure `packages/ui/theme/tokens.ts` exists. If missing, create it first or run initial sync.

### Issue: Script fails with TypeScript errors

**Solution:** Ensure `ts-node` is available:
```bash
pnpm add -D ts-node typescript @types/node
```

---

## Future Enhancements

Potential improvements:

- [ ] Auto-update `plugin.ts` and `tailwind-preset.js`
- [ ] Support gradient token sync from Figma
- [ ] Support motion/easing token sync
- [ ] Generate component prop types from tokens
- [ ] Visual diff preview in browser
- [ ] Integration with Figma API (direct sync)

---

## Support

For issues or questions:
1. Check `TOKEN_DRIFT_REPORT.md` for detailed drift analysis
2. Review script output for specific error messages
3. Use `--dry-run` to preview changes safely
