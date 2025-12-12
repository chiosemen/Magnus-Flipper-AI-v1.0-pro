#!/usr/bin/env ts-node

/**
 * Figma-to-Code Sync Script
 * 
 * Converts Figma design tokens JSON into:
 * - packages/ui/theme/tokens.ts
 * - packages/ui/theme/plugin.ts
 * - packages/ui/tailwind-preset.js
 * 
 * Usage:
 *   ts-node scripts/figma-sync.ts [--input design/figma-tokens.json] [--dry-run] [--force]
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface FigmaTokens {
  colors?: {
    dark?: {
      semantic?: Record<string, Record<string, string>>;
      background?: Record<string, string>;
      border?: Record<string, string>;
      text?: Record<string, string>;
      chart?: Record<string, string>;
      traffic?: Record<string, string>;
    };
    light?: {
      semantic?: Record<string, Record<string, string>>;
      background?: Record<string, string>;
      border?: Record<string, string>;
      text?: Record<string, string>;
    };
  };
  typography?: {
    headings?: Record<string, TypographyToken>;
    body?: Record<string, TypographyToken>;
    mono?: Record<string, TypographyToken>;
  };
  spacing?: {
    scale?: Record<string, string>;
    semantic?: Record<string, string>;
  };
  radius?: Record<string, string>;
  shadows?: Record<string, string>;
  transitions?: Record<string, string>;
  gradients?: Record<string, string>;
}

interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: number | string;
  letterSpacing?: string;
  lineHeight: string;
}

interface TokenChanges {
  added: string[];
  removed: string[];
  modified: Array<{ key: string; old: string; new: string }>;
}

class FigmaSyncEngine {
  private figmaTokens: FigmaTokens;
  private dryRun: boolean;
  private force: boolean;
  private changes: TokenChanges = {
    added: [],
    removed: [],
    modified: [],
  };

  constructor(figmaPath: string, dryRun = false, force = false) {
    this.dryRun = dryRun;
    this.force = force;
    this.figmaTokens = this.loadFigmaTokens(figmaPath);
  }

  private loadFigmaTokens(path: string): FigmaTokens {
    if (!fs.existsSync(path)) {
      throw new Error(`Figma tokens file not found: ${path}`);
    }
    const content = fs.readFileSync(path, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Convert Figma color tokens to code format
   */
  private convertColors(): string {
    const colors: Record<string, string> = {};
    const dark = this.figmaTokens.colors?.dark;

    if (!dark) {
      throw new Error('Dark theme colors not found in Figma tokens');
    }

    // Semantic colors
    if (dark.semantic) {
      Object.entries(dark.semantic).forEach(([semantic, shades]) => {
        Object.entries(shades).forEach(([shade, value]) => {
          const key = `${semantic}${shade}`;
          colors[key] = value;
        });
      });
    }

    // Background colors
    if (dark.background) {
      Object.entries(dark.background).forEach(([key, value]) => {
        colors[key === 'primary' ? 'background' : key] = value;
      });
    }

    // Border colors
    if (dark.border) {
      Object.entries(dark.border).forEach(([key, value]) => {
        colors[key === 'subtle' ? 'borderLight' : 'border'] = value;
      });
    }

    // Text colors
    if (dark.text) {
      Object.entries(dark.text).forEach(([key, value]) => {
        colors[`text${key.charAt(0).toUpperCase() + key.slice(1)}`] = value;
      });
    }

    // Chart colors
    if (dark.chart) {
      Object.entries(dark.chart).forEach(([key, value]) => {
        colors[`chart${key.charAt(0).toUpperCase() + key.slice(1)}`] = value;
      });
    }

    // Traffic colors
    if (dark.traffic) {
      Object.entries(dark.traffic).forEach(([key, value]) => {
        colors[`traffic${key.charAt(0).toUpperCase() + key.slice(1)}`] = value;
      });
    }

    // Generate TypeScript export
    const entries = Object.entries(colors)
      .map(([key, value]) => `  ${key}: '${value}',`)
      .join('\n');

    return `export const colors = {\n${entries}\n};`;
  }

  /**
   * Convert Figma typography tokens to code format
   */
  private convertTypography(): string {
    const typography: Record<string, TypographyToken> = {};
    const figma = this.figmaTokens.typography;

    if (!figma) {
      throw new Error('Typography tokens not found in Figma tokens');
    }

    // Headings
    if (figma.headings) {
      Object.entries(figma.headings).forEach(([key, token]) => {
        typography[key] = token;
      });
    }

    // Body
    if (figma.body) {
      Object.entries(figma.body).forEach(([key, token]) => {
        typography[key] = token;
      });
    }

    // Mono
    if (figma.mono) {
      Object.entries(figma.mono).forEach(([key, token]) => {
        typography[key] = token;
      });
    }

    // Generate TypeScript export
    const entries = Object.entries(typography)
      .map(([key, token]) => {
        const lineHeight = token.lineHeight.includes('px')
          ? token.lineHeight
          : `'${token.lineHeight}'`;
        const letterSpacing = token.letterSpacing
          ? `, letterSpacing: '${token.letterSpacing}'`
          : '';
        return `  ${key}: { fontSize: '${token.fontSize}', lineHeight: ${lineHeight}, fontWeight: ${token.fontWeight}${letterSpacing} },`;
      })
      .join('\n');

    return `export const typography = {\n${entries}\n};`;
  }

  /**
   * Convert Figma spacing tokens to code format
   */
  private convertSpacing(): string {
    const spacing: Record<string, string> = {};
    const figma = this.figmaTokens.spacing;

    if (!figma?.scale) {
      throw new Error('Spacing scale not found in Figma tokens');
    }

    Object.entries(figma.scale).forEach(([key, value]) => {
      spacing[key] = value;
    });

    const entries = Object.entries(spacing)
      .map(([key, value]) => `  ${key}: '${value}',`)
      .join('\n');

    return `export const spacing = {\n${entries}\n};`;
  }

  /**
   * Convert semantic spacing tokens
   */
  private convertSemanticSpacing(): string {
    const semantic: Record<string, string> = {};
    const figma = this.figmaTokens.spacing?.semantic;

    if (!figma) {
      return `export const semanticSpacing = {};`;
    }

    Object.entries(figma).forEach(([key, value]) => {
      semantic[key] = value;
    });

    const entries = Object.entries(semantic)
      .map(([key, value]) => `  ${key}: '${value}',`)
      .join('\n');

    return `export const semanticSpacing = {\n${entries}\n};`;
  }

  /**
   * Convert Figma radius tokens to code format
   */
  private convertRadius(): string {
    const radius: Record<string, string> = {};
    const figma = this.figmaTokens.radius;

    if (!figma) {
      throw new Error('Radius tokens not found in Figma tokens');
    }

    Object.entries(figma).forEach(([key, value]) => {
      radius[key] = value;
    });

    const entries = Object.entries(radius)
      .map(([key, value]) => `  ${key}: '${value}',`)
      .join('\n');

    return `export const radius = {\n${entries}\n};`;
  }

  /**
   * Convert Figma shadow tokens to code format
   */
  private convertShadows(): string {
    const shadows: Record<string, string> = {};
    const figma = this.figmaTokens.shadows;

    if (!figma) {
      throw new Error('Shadow tokens not found in Figma tokens');
    }

    Object.entries(figma).forEach(([key, value]) => {
      shadows[key] = value;
    });

    const entries = Object.entries(shadows)
      .map(([key, value]) => `  ${key}: '${value}',`)
      .join('\n');

    return `export const shadows = {\n${entries}\n};`;
  }

  /**
   * Convert Figma transition tokens to code format
   */
  private convertTransitions(): string {
    const transitions: Record<string, string> = {};
    const figma = this.figmaTokens.transitions;

    if (!figma) {
      return `export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
};`;
    }

    Object.entries(figma).forEach(([key, value]) => {
      // Extract duration from "150ms ease" format
      const duration = value.split(' ')[0];
      transitions[key] = duration;
    });

    const entries = Object.entries(transitions)
      .map(([key, value]) => `  ${key}: '${value}',`)
      .join('\n');

    return `export const transitions = {\n${entries}\n};`;
  }

  /**
   * Generate complete tokens.ts file
   */
  private generateTokensFile(): string {
    const colors = this.convertColors();
    const spacing = this.convertSpacing();
    const semanticSpacing = this.convertSemanticSpacing();
    const radius = this.convertRadius();
    const shadows = this.convertShadows();
    const transitions = this.convertTransitions();
    const typography = this.convertTypography();

    return `/**
 * Design Tokens - Auto-generated from Figma
 * 
 * DO NOT EDIT MANUALLY - This file is generated by scripts/figma-sync.ts
 * To update, run: ts-node scripts/figma-sync.ts
 * 
 * Last synced: ${new Date().toISOString()}
 */

${colors}

${spacing}

${semanticSpacing}

${radius}

${shadows}

${transitions}

export const motion = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },
  stagger: {
    fast: '50ms',
    normal: '100ms',
    slow: '150ms',
  },
};

export const fonts = {
  heading: ['Satoshi', 'Inter', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
  mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular'],
};

${typography}

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  max: 9999,
};

export const gradients = {
  primary: 'linear-gradient(135deg, #4FF0E6 0%, #8A4FFF 100%)',
  accent: 'linear-gradient(135deg, #8A4FFF 0%, #4FF0E6 100%)',
  hero: 'linear-gradient(135deg, #0D1117 0%, #161B22 50%, #0D1117 100%)',
  card: 'linear-gradient(145deg, #161B22 0%, #0D1117 100%)',
  glow: 'radial-gradient(ellipse at center, rgba(79, 240, 230, 0.4) 0%, transparent 70%)',
  surface: 'linear-gradient(180deg, #161B22 0%, #1C2128 100%)',
  brandPrimary: 'linear-gradient(135deg, #4FF0E6 0%, #1AE0D7 100%)',
  brandAccent: 'linear-gradient(135deg, #8A4FFF 0%, #6D3FCC 100%)',
  brandCombined: 'linear-gradient(135deg, #4FF0E6 0%, #8A4FFF 100%)',
};

export const tokens = {
  colors,
  spacing,
  semanticSpacing,
  radius,
  shadows,
  transitions,
  motion,
  fonts,
  typography,
  zIndex,
  gradients,
};

export type ThemeTokens = typeof tokens;
`;
  }

  /**
   * Compare existing tokens with Figma tokens and detect changes
   */
  private detectChanges(): TokenChanges {
    // This is a simplified version - full implementation would parse existing files
    // and compare token by token
    return this.changes;
  }

  /**
   * Check if changes are too large (safety check)
   */
  private isChangeTooLarge(changes: TokenChanges): boolean {
    const totalChanges = changes.added.length + changes.removed.length + changes.modified.length;
    return totalChanges > 50 && !this.force;
  }

  /**
   * Write tokens.ts file
   */
  private writeTokensFile(content: string): void {
    const filePath = path.join(process.cwd(), 'packages/ui/theme/tokens.ts');
    
    if (this.dryRun) {
      console.log(`[DRY RUN] Would write to ${filePath}`);
      console.log(`[DRY RUN] Content length: ${content.length} characters`);
      return;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Written: ${filePath}`);
  }

  /**
   * Main sync execution
   */
  public async sync(): Promise<void> {
    console.log('🔄 Starting Figma-to-Code sync...\n');

    try {
      // Generate tokens.ts
      const tokensContent = this.generateTokensFile();
      
      // Detect changes
      const changes = this.detectChanges();
      
      // Safety check
      if (this.isChangeTooLarge(changes)) {
        console.error('❌ ERROR: Too many changes detected (>50 tokens). Use --force to override.');
        process.exit(1);
      }

      // Show summary
      console.log('📊 Changes Summary:');
      console.log(`   Added: ${changes.added.length}`);
      console.log(`   Removed: ${changes.removed.length}`);
      console.log(`   Modified: ${changes.modified.length}\n`);

      if (changes.added.length > 0) {
        console.log('   Added tokens:', changes.added.join(', '));
      }
      if (changes.modified.length > 0) {
        console.log('   Modified tokens:');
        changes.modified.forEach(({ key, old, new: newVal }) => {
          console.log(`     ${key}: ${old} → ${newVal}`);
        });
      }

      // Write files
      this.writeTokensFile(tokensContent);

      console.log('\n✅ Sync complete!');
      console.log('\n⚠️  Note: plugin.ts and tailwind-preset.js need manual updates.');
      console.log('   Run: ts-node scripts/compare-figma-code.ts --fix to update them.');

    } catch (error) {
      console.error('❌ Sync failed:', error);
      process.exit(1);
    }
  }
}

// CLI parsing
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const inputPath = inputIndex >= 0 && args[inputIndex + 1]
  ? args[inputIndex + 1]
  : 'design/figma-tokens.json';
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

// Execute
const engine = new FigmaSyncEngine(inputPath, dryRun, force);
engine.sync().catch(console.error);
