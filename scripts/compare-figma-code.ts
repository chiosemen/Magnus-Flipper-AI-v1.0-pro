#!/usr/bin/env ts-node

/**
 * Figma-to-Code Comparison & Drift Detection Script
 * 
 * Compares Figma tokens JSON with existing code tokens and:
 * - Generates drift reports
 * - Applies fixes automatically (--fix flag)
 * - Validates token consistency (--strict flag)
 * 
 * Usage:
 *   ts-node scripts/compare-figma-code.ts [--report] [--fix] [--strict]
 */

import * as fs from 'fs';
import * as path from 'path';

interface DriftIssue {
  type: 'missing' | 'mismatch' | 'extra' | 'format';
  category: 'colors' | 'typography' | 'spacing' | 'radius' | 'shadows' | 'motion';
  key: string;
  figmaValue?: string;
  codeValue?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
}

interface DriftReport {
  issues: DriftIssue[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

class FigmaCodeComparator {
  private figmaTokens: any;
  private codeTokens: any;
  private report: DriftReport;
  private fixMode: boolean;
  private strictMode: boolean;

  constructor(figmaPath: string, fixMode = false, strictMode = false) {
    this.fixMode = fixMode;
    this.strictMode = strictMode;
    this.figmaTokens = this.loadFigmaTokens(figmaPath);
    this.codeTokens = this.loadCodeTokens();
    this.report = {
      issues: [],
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    };
  }

  private loadFigmaTokens(path: string): any {
    if (!fs.existsSync(path)) {
      throw new Error(`Figma tokens file not found: ${path}`);
    }
    return JSON.parse(fs.readFileSync(path, 'utf-8'));
  }

  private loadCodeTokens(): any {
    // Parse tokens.ts file
    const tokensPath = path.join(process.cwd(), 'packages/ui/theme/tokens.ts');
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`Code tokens file not found: ${tokensPath}`);
    }

    // This is a simplified parser - in production, use a proper TypeScript parser
    const content = fs.readFileSync(tokensPath, 'utf-8');
    
    // Extract token values using regex (simplified - production should use AST)
    const tokens: any = {};
    
    // Extract colors
    const colorsMatch = content.match(/export const colors = \{([\s\S]*?)\};/);
    if (colorsMatch) {
      tokens.colors = this.parseObject(colorsMatch[1]);
    }

    // Extract spacing
    const spacingMatch = content.match(/export const spacing = \{([\s\S]*?)\};/);
    if (spacingMatch) {
      tokens.spacing = this.parseObject(spacingMatch[1]);
    }

    // Extract radius
    const radiusMatch = content.match(/export const radius = \{([\s\S]*?)\};/);
    if (radiusMatch) {
      tokens.radius = this.parseObject(radiusMatch[1]);
    }

    // Extract shadows
    const shadowsMatch = content.match(/export const shadows = \{([\s\S]*?)\};/);
    if (shadowsMatch) {
      tokens.shadows = this.parseObject(shadowsMatch[1]);
    }

    return tokens;
  }

  private parseObject(content: string): Record<string, string> {
    const obj: Record<string, string> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/(\w+):\s*['"]([^'"]+)['"]/);
      if (match) {
        obj[match[1]] = match[2];
      }
    }
    
    return obj;
  }

  /**
   * Compare radius tokens
   */
  private compareRadius(): void {
    const figmaRadius = this.figmaTokens.radius || {};
    const codeRadius = this.codeTokens.radius || {};

    // Check each Figma radius token
    Object.entries(figmaRadius).forEach(([key, figmaValue]) => {
      const codeValue = codeRadius[key];
      
      if (!codeValue) {
        this.report.issues.push({
          type: 'missing',
          category: 'radius',
          key,
          figmaValue: figmaValue as string,
          severity: 'critical',
          message: `Radius token '${key}' exists in Figma (${figmaValue}) but missing in code`,
        });
      } else if (codeValue !== figmaValue) {
        this.report.issues.push({
          type: 'mismatch',
          category: 'radius',
          key,
          figmaValue: figmaValue as string,
          codeValue,
          severity: 'critical',
          message: `Radius token '${key}' mismatch: Figma=${figmaValue}, Code=${codeValue}`,
        });
      }
    });

    // Check for extra tokens in code
    Object.keys(codeRadius).forEach((key) => {
      if (!figmaRadius[key] && key !== 'card' && key !== 'full') {
        this.report.issues.push({
          type: 'extra',
          category: 'radius',
          key,
          codeValue: codeRadius[key],
          severity: 'low',
          message: `Radius token '${key}' exists in code but not in Figma`,
        });
      }
    });
  }

  /**
   * Compare shadow tokens
   */
  private compareShadows(): void {
    const figmaShadows = this.figmaTokens.shadows || {};
    const codeShadows = this.codeTokens.shadows || {};

    Object.entries(figmaShadows).forEach(([key, figmaValue]) => {
      const codeValue = codeShadows[key];
      
      if (!codeValue) {
        this.report.issues.push({
          type: 'missing',
          category: 'shadows',
          key,
          figmaValue: figmaValue as string,
          severity: 'critical',
          message: `Shadow token '${key}' exists in Figma but missing in code`,
        });
      } else if (codeValue !== figmaValue) {
        this.report.issues.push({
          type: 'mismatch',
          category: 'shadows',
          key,
          figmaValue: figmaValue as string,
          codeValue,
          severity: 'critical',
          message: `Shadow token '${key}' mismatch: Figma=${figmaValue}, Code=${codeValue}`,
        });
      }
    });
  }

  /**
   * Compare spacing tokens
   */
  private compareSpacing(): void {
    const figmaSpacing = this.figmaTokens.spacing?.scale || {};
    const codeSpacing = this.codeTokens.spacing || {};

    Object.entries(figmaSpacing).forEach(([key, figmaValue]) => {
      const codeValue = codeSpacing[key];
      
      if (!codeValue) {
        this.report.issues.push({
          type: 'missing',
          category: 'spacing',
          key,
          figmaValue: figmaValue as string,
          severity: 'high',
          message: `Spacing token '${key}' exists in Figma but missing in code`,
        });
      } else if (codeValue !== figmaValue) {
        this.report.issues.push({
          type: 'mismatch',
          category: 'spacing',
          key,
          figmaValue: figmaValue as string,
          codeValue,
          severity: 'high',
          message: `Spacing token '${key}' mismatch: Figma=${figmaValue}, Code=${codeValue}`,
        });
      }
    });
  }

  /**
   * Compare color tokens
   */
  private compareColors(): void {
    const figmaColors = this.figmaTokens.colors?.dark || {};
    const codeColors = this.codeTokens.colors || {};

    // Check semantic colors
    if (figmaColors.semantic) {
      Object.entries(figmaColors.semantic).forEach(([semantic, shades]) => {
        Object.entries(shades as Record<string, string>).forEach(([shade, figmaValue]) => {
          const key = `${semantic}${shade}`;
          const codeValue = codeColors[key];
          
          if (!codeValue) {
            this.report.issues.push({
              type: 'missing',
              category: 'colors',
              key,
              figmaValue,
              severity: 'high',
              message: `Color token '${key}' exists in Figma but missing in code`,
            });
          } else if (codeValue !== figmaValue) {
            this.report.issues.push({
              type: 'mismatch',
              category: 'colors',
              key,
              figmaValue,
              codeValue,
              severity: 'critical',
              message: `Color token '${key}' mismatch: Figma=${figmaValue}, Code=${codeValue}`,
            });
          }
        });
      });
    }
  }

  /**
   * Run all comparisons
   */
  public compare(): DriftReport {
    console.log('🔍 Comparing Figma tokens with code tokens...\n');

    this.compareRadius();
    this.compareShadows();
    this.compareSpacing();
    this.compareColors();

    // Calculate summary
    this.report.summary.total = this.report.issues.length;
    this.report.summary.critical = this.report.issues.filter(i => i.severity === 'critical').length;
    this.report.summary.high = this.report.issues.filter(i => i.severity === 'high').length;
    this.report.summary.medium = this.report.issues.filter(i => i.severity === 'medium').length;
    this.report.summary.low = this.report.issues.filter(i => i.severity === 'low').length;

    return this.report;
  }

  /**
   * Generate markdown report
   */
  public generateReport(): string {
    const { issues, summary } = this.report;

    let report = `# 🔍 Token Drift Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Total Issues:** ${summary.total}\n\n`;

    report += `## 📊 Summary\n\n`;
    report += `- **Critical:** ${summary.critical}\n`;
    report += `- **High:** ${summary.high}\n`;
    report += `- **Medium:** ${summary.medium}\n`;
    report += `- **Low:** ${summary.low}\n\n`;

    if (issues.length === 0) {
      report += `## ✅ No Issues Found\n\n`;
      report += `All tokens are synchronized with Figma.\n`;
      return report;
    }

    // Group by category
    const byCategory: Record<string, DriftIssue[]> = {};
    issues.forEach(issue => {
      if (!byCategory[issue.category]) {
        byCategory[issue.category] = [];
      }
      byCategory[issue.category].push(issue);
    });

    report += `## 💥 Issues by Category\n\n`;

    Object.entries(byCategory).forEach(([category, categoryIssues]) => {
      report += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      
      categoryIssues.forEach(issue => {
        const icon = issue.severity === 'critical' ? '🔴' : 
                    issue.severity === 'high' ? '🟠' : 
                    issue.severity === 'medium' ? '🟡' : '🟢';
        
        report += `${icon} **${issue.key}** (${issue.severity})\n`;
        report += `   ${issue.message}\n`;
        if (issue.figmaValue && issue.codeValue) {
          report += `   - Figma: \`${issue.figmaValue}\`\n`;
          report += `   - Code: \`${issue.codeValue}\`\n`;
        }
        report += `\n`;
      });
    });

    return report;
  }

  /**
   * Apply fixes (if --fix flag is set)
   */
  public async applyFixes(): Promise<void> {
    if (!this.fixMode) {
      return;
    }

    console.log('🔧 Applying fixes...\n');

    // This would trigger the figma-sync.ts script
    // For now, just log what would be fixed
    const criticalIssues = this.report.issues.filter(i => i.severity === 'critical');
    
    if (criticalIssues.length > 0) {
      console.log(`Would fix ${criticalIssues.length} critical issues:`);
      criticalIssues.forEach(issue => {
        console.log(`  - ${issue.category}.${issue.key}: ${issue.codeValue} → ${issue.figmaValue}`);
      });
      console.log('\nRun: ts-node scripts/figma-sync.ts to apply fixes.');
    }
  }
}

// CLI parsing
const args = process.argv.slice(2);
const reportOnly = args.includes('--report');
const fixMode = args.includes('--fix');
const strictMode = args.includes('--strict');
const figmaPath = args.find(arg => arg.startsWith('--input='))?.split('=')[1] || 'design/figma-tokens.json';

// Execute
const comparator = new FigmaCodeComparator(figmaPath, fixMode, strictMode);
const report = comparator.compare();

if (reportOnly || !fixMode) {
  const reportMarkdown = comparator.generateReport();
  console.log(reportMarkdown);
  
  // Write report file
  const reportPath = path.join(process.cwd(), 'TOKEN_DRIFT_REPORT.md');
  fs.writeFileSync(reportPath, reportMarkdown, 'utf-8');
  console.log(`\n📄 Report written to: ${reportPath}`);
}

if (fixMode) {
  comparator.applyFixes();
}

// Exit with error code if critical issues found
if (report.summary.critical > 0 && strictMode) {
  console.error(`\n❌ Strict mode: ${report.summary.critical} critical issues found.`);
  process.exit(1);
}
