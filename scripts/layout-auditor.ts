#!/usr/bin/env ts-node

/**
 * UI Layout Auditor Script
 * 
 * Validates layout structure against architecture diagrams and design tokens
 * 
 * Usage:
 *   ts-node scripts/layout-auditor.ts [--component <name>] [--strict]
 */

import * as fs from 'fs';
import * as path from 'path';

interface LayoutViolation {
  type: 'structure' | 'naming' | 'token' | 'motion' | 'spacing' | 'hierarchy';
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  file: string;
  message: string;
  expected?: string;
  actual?: string;
  fix?: string;
}

interface LayoutAuditReport {
  component: string;
  violations: LayoutViolation[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

class LayoutAuditor {
  private violations: LayoutViolation[] = [];
  private tokens: any = {};

  constructor() {
    this.loadTokens();
  }

  private loadTokens(): void {
    const tokensPath = path.join(process.cwd(), 'packages/ui/theme/tokens.ts');
    if (fs.existsSync(tokensPath)) {
      const content = fs.readFileSync(tokensPath, 'utf-8');
      // Extract token values (simplified parser)
      this.tokens.spacing = this.extractObject(content, 'spacing');
      this.tokens.radius = this.extractObject(content, 'radius');
      this.tokens.shadows = this.extractObject(content, 'shadows');
    }
  }

  private extractObject(content: string, name: string): Record<string, string> {
    const obj: Record<string, string> = {};
    const regex = new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\};`);
    const match = content.match(regex);
    if (match) {
      const lines = match[1].split('\n');
      for (const line of lines) {
        const propMatch = line.match(/(\w+):\s*['"]([^'"]+)['"]/);
        if (propMatch) {
          obj[propMatch[1]] = propMatch[2];
        }
      }
    }
    return obj;
  }

  /**
   * Audit a component file
   */
  public auditComponent(filePath: string): LayoutAuditReport {
    this.violations = [];
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Component file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const componentName = path.basename(filePath, '.tsx');

    // Check structure
    this.checkStructure(content, componentName, filePath);
    
    // Check naming
    this.checkNaming(content, componentName, filePath);
    
    // Check token usage
    this.checkTokenUsage(content, componentName, filePath);
    
    // Check motion
    this.checkMotion(content, componentName, filePath);
    
    // Check spacing
    this.checkSpacing(content, componentName, filePath);

    // Calculate summary
    const summary = {
      total: this.violations.length,
      critical: this.violations.filter(v => v.severity === 'critical').length,
      high: this.violations.filter(v => v.severity === 'high').length,
      medium: this.violations.filter(v => v.severity === 'medium').length,
      low: this.violations.filter(v => v.severity === 'low').length,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      component: componentName,
      violations: this.violations,
      summary,
      recommendations,
    };
  }

  private checkStructure(content: string, component: string, file: string): void {
    // Check for AppShell usage in layout files
    if (file.includes('layout') && !content.includes('AppShell')) {
      this.violations.push({
        type: 'structure',
        severity: 'high',
        component,
        file,
        message: 'Layout file should use AppShell wrapper',
        expected: 'AppShell',
        actual: 'Missing',
      });
    }

    // Check for proper grid/stack usage
    if (content.includes('grid') && !content.includes('grid-cols')) {
      this.violations.push({
        type: 'structure',
        severity: 'medium',
        component,
        file,
        message: 'Grid layout missing grid-cols definition',
      });
    }
  }

  private checkNaming(content: string, component: string, file: string): void {
    // Check for correct component naming conventions
    const validNames = ['AppShell', 'Navbar', 'SideNav', 'PageHeader', 'Section', 'Card'];
    const componentMatch = content.match(/export\s+(?:function|const)\s+(\w+)/);
    
    if (componentMatch && !validNames.includes(componentMatch[1])) {
      // Allow if it's a screen-specific component
      if (!file.includes('screen-sections') && !file.includes('app/')) {
        this.violations.push({
          type: 'naming',
          severity: 'low',
          component,
          file,
          message: `Component name '${componentMatch[1]}' doesn't follow standard naming convention`,
          expected: 'One of: ' + validNames.join(', '),
          actual: componentMatch[1],
        });
      }
    }
  }

  private checkTokenUsage(content: string, component: string, file: string): void {
    // Check for hardcoded spacing values
    const hardcodedSpacing = content.match(/(?:p|m|px|py|mx|my|gap|space)-(\d+)/g);
    if (hardcodedSpacing) {
      hardcodedSpacing.forEach(match => {
        const value = match.match(/\d+/)?.[0];
        if (value && !this.tokens.spacing[value]) {
          this.violations.push({
            type: 'token',
            severity: 'medium',
            component,
            file,
            message: `Hardcoded spacing value: ${match}`,
            expected: `Use spacing token (e.g., spacing.${value})`,
            actual: match,
            fix: `Replace ${match} with spacing token`,
          });
        }
      });
    }

    // Check for hardcoded radius values
    const hardcodedRadius = content.match(/rounded-(sm|md|lg|xl|2xl|3xl|full)/g);
    if (hardcodedRadius) {
      hardcodedRadius.forEach(match => {
        // Check if it matches token values
        const radiusKey = match.replace('rounded-', '');
        if (!this.tokens.radius[radiusKey] && radiusKey !== 'full') {
          this.violations.push({
            type: 'token',
            severity: 'low',
            component,
            file,
            message: `Radius value may not match token: ${match}`,
          });
        }
      });
    }

    // Check for hardcoded colors
    const hardcodedColors = content.match(/(?:bg|text|border)-(blue|red|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g);
    if (hardcodedColors) {
      hardcodedColors.forEach(match => {
        this.violations.push({
          type: 'token',
          severity: 'critical',
          component,
          file,
          message: `Hardcoded color class: ${match}`,
          expected: 'Use semantic color token (e.g., bg-primary, text-foreground)',
          actual: match,
          fix: `Replace ${match} with semantic color token`,
        });
      });
    }
  }

  private checkMotion(content: string, component: string, file: string): void {
    // Check for Framer Motion usage
    if (content.includes('framer-motion') || content.includes('motion.')) {
      // Check for hardcoded durations
      const hardcodedDuration = content.match(/duration:\s*(\d+)/g);
      if (hardcodedDuration) {
        hardcodedDuration.forEach(match => {
          this.violations.push({
            type: 'motion',
            severity: 'medium',
            component,
            file,
            message: `Hardcoded motion duration: ${match}`,
            expected: 'Use motion.duration token',
            actual: match,
          });
        });
      }

      // Check for hardcoded easing
      const hardcodedEasing = content.match(/ease:\s*['"]([^'"]+)['"]/g);
      if (hardcodedEasing) {
        hardcodedEasing.forEach(match => {
          if (!match.includes('ease-in') && !match.includes('ease-out') && !match.includes('ease-in-out')) {
            this.violations.push({
              type: 'motion',
              severity: 'low',
              component,
              file,
              message: `Custom easing function: ${match}`,
              expected: 'Use motion easing token',
              actual: match,
            });
          }
        });
      }
    }
  }

  private checkSpacing(content: string, component: string, file: string): void {
    // Check for proper spacing scale usage
    // Look for spacing that doesn't follow 4px scale
    const spacingValues = content.match(/(?:p|m|px|py|mx|my|gap|space)-(\d+)/g);
    if (spacingValues) {
      spacingValues.forEach(match => {
        const value = parseInt(match.match(/\d+/)?.[0] || '0');
        // Check if value is in spacing scale (0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)
        const validSpacing = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
        if (!validSpacing.includes(value)) {
          this.violations.push({
            type: 'spacing',
            severity: 'high',
            component,
            file,
            message: `Spacing value ${value} not in design scale`,
            expected: 'Use spacing from design scale: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24',
            actual: `${value}`,
          });
        }
      });
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = this.violations.filter(v => v.severity === 'critical').length;
    const tokenViolations = this.violations.filter(v => v.type === 'token').length;
    const structureViolations = this.violations.filter(v => v.type === 'structure').length;

    if (criticalCount > 0) {
      recommendations.push(`Fix ${criticalCount} critical violations immediately`);
    }

    if (tokenViolations > 0) {
      recommendations.push(`Replace ${tokenViolations} hardcoded values with design tokens`);
    }

    if (structureViolations > 0) {
      recommendations.push(`Review ${structureViolations} structure violations against architecture diagram`);
    }

    if (this.violations.length === 0) {
      recommendations.push('✅ No violations found - layout is compliant');
    }

    return recommendations;
  }

  /**
   * Generate markdown report
   */
  public generateReport(report: LayoutAuditReport): string {
    let md = `# 🔍 Layout Audit Report: ${report.component}\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n\n`;

    md += `## 📊 Summary\n\n`;
    md += `- **Total Violations:** ${report.summary.total}\n`;
    md += `- **Critical:** ${report.summary.critical}\n`;
    md += `- **High:** ${report.summary.high}\n`;
    md += `- **Medium:** ${report.summary.medium}\n`;
    md += `- **Low:** ${report.summary.low}\n\n`;

    if (report.violations.length === 0) {
      md += `## ✅ No Violations Found\n\n`;
      md += `Layout structure is compliant with architecture diagrams and design tokens.\n`;
      return md;
    }

    // Group by type
    const byType: Record<string, LayoutViolation[]> = {};
    report.violations.forEach(v => {
      if (!byType[v.type]) byType[v.type] = [];
      byType[v.type].push(v);
    });

    md += `## 💥 Violations by Type\n\n`;

    Object.entries(byType).forEach(([type, violations]) => {
      md += `### ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n`;
      
      violations.forEach(v => {
        const icon = v.severity === 'critical' ? '🔴' : 
                    v.severity === 'high' ? '🟠' : 
                    v.severity === 'medium' ? '🟡' : '🟢';
        
        md += `${icon} **${v.severity.toUpperCase()}** - ${v.message}\n`;
        md += `   - File: \`${v.file}\`\n`;
        if (v.expected) md += `   - Expected: ${v.expected}\n`;
        if (v.actual) md += `   - Actual: ${v.actual}\n`;
        if (v.fix) md += `   - Fix: ${v.fix}\n`;
        md += `\n`;
      });
    });

    md += `## 💡 Recommendations\n\n`;
    report.recommendations.forEach(rec => {
      md += `- ${rec}\n`;
    });

    return md;
  }
}

// CLI
const args = process.argv.slice(2);
const componentIndex = args.indexOf('--component');
const componentPath = componentIndex >= 0 && args[componentIndex + 1]
  ? args[componentIndex + 1]
  : 'apps/web/app/(components)/layout/AppShell.tsx';

const auditor = new LayoutAuditor();
const report = auditor.auditComponent(componentPath);
const reportMarkdown = auditor.generateReport(report);

console.log(reportMarkdown);

// Write report
const reportPath = path.join(process.cwd(), `LAYOUT_AUDIT_${report.component}.md`);
fs.writeFileSync(reportPath, reportMarkdown, 'utf-8');
console.log(`\n📄 Report written to: ${reportPath}`);

// Exit with error if critical issues
if (report.summary.critical > 0 && args.includes('--strict')) {
  process.exit(1);
}
