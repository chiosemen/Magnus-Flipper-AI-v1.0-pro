#!/usr/bin/env ts-node

/**
 * Testing Supervisor Script
 * 
 * Ensures 100% UI test coverage by analyzing components and generating test cases
 * 
 * Usage:
 *   ts-node scripts/testing-supervisor.ts [--component <name>] [--generate] [--coverage]
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestCoverage {
  component: string;
  file: string;
  hasUnitTests: boolean;
  hasIntegrationTests: boolean;
  hasAccessibilityTests: boolean;
  hasVisualTests: boolean;
  propsTested: string[];
  propsMissing: string[];
  variantsTested: string[];
  variantsMissing: string[];
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

interface TestCase {
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'accessibility' | 'visual';
  code: string;
}

class TestingSupervisor {
  private components: string[] = [];
  private coverageReports: TestCoverage[] = [];

  /**
   * Discover all UI components
   */
  public discoverComponents(): string[] {
    const uiComponentsPath = path.join(process.cwd(), 'packages/ui/components');
    const webComponentsPath = path.join(process.cwd(), 'apps/web/app/(components)');
    
    const components: string[] = [];

    // Discover UI package components
    if (fs.existsSync(uiComponentsPath)) {
      const files = fs.readdirSync(uiComponentsPath, { recursive: true });
      files.forEach(file => {
        if (typeof file === 'string' && file.endsWith('.tsx') && !file.includes('.test.')) {
          components.push(path.join(uiComponentsPath, file));
        }
      });
    }

    // Discover web app components
    if (fs.existsSync(webComponentsPath)) {
      const files = fs.readdirSync(webComponentsPath, { recursive: true });
      files.forEach(file => {
        if (typeof file === 'string' && file.endsWith('.tsx') && !file.includes('.test.')) {
          components.push(path.join(webComponentsPath, file));
        }
      });
    }

    this.components = components;
    return components;
  }

  /**
   * Analyze component test coverage
   */
  public analyzeCoverage(componentPath: string): TestCoverage {
    const componentName = path.basename(componentPath, '.tsx');
    const componentDir = path.dirname(componentPath);
    
    const testFiles = {
      unit: path.join(componentDir, `${componentName}.test.tsx`),
      integration: path.join(componentDir, `${componentName}.integration.test.tsx`),
      accessibility: path.join(componentDir, `${componentName}.accessibility.test.tsx`),
      visual: path.join(componentDir, `${componentName}.visual.test.tsx`),
    };

    const content = fs.readFileSync(componentPath, 'utf-8');
    
    // Extract component props
    const props = this.extractProps(content);
    
    // Extract variants
    const variants = this.extractVariants(content);

    // Check which props are tested
    const propsTested: string[] = [];
    const propsMissing: string[] = [];
    
    if (fs.existsSync(testFiles.unit)) {
      const testContent = fs.readFileSync(testFiles.unit, 'utf-8');
      props.forEach(prop => {
        if (testContent.includes(prop)) {
          propsTested.push(prop);
        } else {
          propsMissing.push(prop);
        }
      });
    } else {
      propsMissing.push(...props);
    }

    return {
      component: componentName,
      file: componentPath,
      hasUnitTests: fs.existsSync(testFiles.unit),
      hasIntegrationTests: fs.existsSync(testFiles.integration),
      hasAccessibilityTests: fs.existsSync(testFiles.accessibility),
      hasVisualTests: fs.existsSync(testFiles.visual),
      propsTested,
      propsMissing,
      variantsTested: [],
      variantsMissing: variants,
      coverage: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    };
  }

  private extractProps(content: string): string[] {
    const props: string[] = [];
    const interfaceMatch = content.match(/export\s+interface\s+\w+Props\s*\{([\s\S]*?)\}/);
    
    if (interfaceMatch) {
      const propsContent = interfaceMatch[1];
      const propLines = propsContent.split('\n');
      propLines.forEach(line => {
        const propMatch = line.match(/(\w+)(\?)?:/);
        if (propMatch) {
          props.push(propMatch[1]);
        }
      });
    }

    return props;
  }

  private extractVariants(content: string): string[] {
    const variants: string[] = [];
    
    // Extract from cva variants
    const cvaMatch = content.match(/variants:\s*\{([\s\S]*?)\}/);
    if (cvaMatch) {
      const variantsContent = cvaMatch[1];
      
      // Extract variant options
      const variantMatch = variantsContent.match(/variant:\s*\{([\s\S]*?)\}/);
      if (variantMatch) {
        const options = variantMatch[1].match(/(\w+):/g);
        if (options) {
          options.forEach(opt => {
            variants.push(opt.replace(':', ''));
          });
        }
      }

      // Extract size options
      const sizeMatch = variantsContent.match(/size:\s*\{([\s\S]*?)\}/);
      if (sizeMatch) {
        const options = sizeMatch[1].match(/(\w+):/g);
        if (options) {
          options.forEach(opt => {
            variants.push(`size-${opt.replace(':', '')}`);
          });
        }
      }
    }

    return variants;
  }

  /**
   * Generate test file for a component
   */
  public generateTestFile(componentPath: string, testType: 'unit' | 'integration' | 'accessibility' | 'visual'): string {
    const componentName = path.basename(componentPath, '.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    const props = this.extractProps(content);
    const variants = this.extractVariants(content);

    let testCode = '';

    switch (testType) {
      case 'unit':
        testCode = this.generateUnitTests(componentName, props, variants);
        break;
      case 'integration':
        testCode = this.generateIntegrationTests(componentName, props);
        break;
      case 'accessibility':
        testCode = this.generateAccessibilityTests(componentName, props);
        break;
      case 'visual':
        testCode = this.generateVisualTests(componentName, variants);
        break;
    }

    return testCode;
  }

  private generateUnitTests(componentName: string, props: string[], variants: string[]): string {
    return `import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${componentName}';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('${componentName}', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<${componentName} />);
      expect(screen.getByRole('${this.getDefaultRole(componentName)}')).toBeInTheDocument();
    });

    it('renders with children', () => {
      render(<${componentName}>Test Content</${componentName}>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
${props.map(prop => `    it('handles ${prop} prop', () => {
      render(<${componentName} ${prop}={${this.getDefaultPropValue(prop)}} />);
      // Add assertions for ${prop}
    });`).join('\n\n')}
  });

  describe('Variants', () => {
${variants.map(variant => `    it('renders ${variant} variant', () => {
      render(<${componentName} variant="${variant}" />);
      // Add assertions for ${variant} variant
    });`).join('\n\n')}
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<${componentName} disabled />);
      expect(screen.getByRole('${this.getDefaultRole(componentName)}')).toHaveAttribute('disabled');
    });

    it('handles loading state', () => {
      render(<${componentName} loading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<${componentName}>Test</${componentName}>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      render(<${componentName} aria-label="Test ${componentName}" />);
      expect(screen.getByLabelText('Test ${componentName}')).toBeInTheDocument();
    });
  });
});
`;
  }

  private generateIntegrationTests(componentName: string, props: string[]): string {
    return `import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${componentName} } from './${componentName}';

describe('${componentName} Integration', () => {
  describe('User Interactions', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(<${componentName} onClick={handleClick}>Click me</${componentName}>);
      
      const button = screen.getByText('Click me');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation', async () => {
      render(<${componentName}>Test</${componentName}>);
      const element = screen.getByRole('${this.getDefaultRole(componentName)}');
      
      element.focus();
      expect(element).toHaveFocus();
      
      await userEvent.keyboard('{Enter}');
      // Add assertions for keyboard interaction
    });
  });

  describe('Form Integration', () => {
    it('works within forms', () => {
      render(
        <form>
          <${componentName} type="submit">Submit</${componentName}>
        </form>
      );
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });
});
`;
  }

  private generateAccessibilityTests(componentName: string, props: string[]): string {
    return `import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ${componentName} } from './${componentName}';

expect.extend(toHaveNoViolations);

describe('${componentName} Accessibility', () => {
  it('meets WCAG 2.1 AA standards', async () => {
    const { container } = render(<${componentName}>Test</${componentName}>);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'aria-required-attr': { enabled: true },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('is keyboard accessible', () => {
    render(<${componentName}>Test</${componentName}>);
    const element = screen.getByRole('${this.getDefaultRole(componentName)}');
    
    element.focus();
    expect(element).toHaveFocus();
    
    // Test keyboard navigation
    expect(element).toHaveAttribute('tabIndex', expect.any(String));
  });

  it('has proper ARIA labels', () => {
    render(<${componentName} aria-label="Test ${componentName}">Content</${componentName}>);
    expect(screen.getByLabelText('Test ${componentName}')).toBeInTheDocument();
  });

  it('supports screen readers', () => {
    render(<${componentName} aria-describedby="description">Test</${componentName}>);
    expect(screen.getByRole('${this.getDefaultRole(componentName)}')).toHaveAttribute('aria-describedby');
  });
});
`;
  }

  private generateVisualTests(componentName: string, variants: string[]): string {
    return `import { test, expect } from '@playwright/test';

test.describe('${componentName} Visual Regression', () => {
  test('renders correctly', async ({ page }) => {
    await page.goto('/test/${componentName.toLowerCase()}');
    await expect(page).toHaveScreenshot('${componentName.toLowerCase()}-default.png');
  });

${variants.map(variant => `  test('renders ${variant} variant', async ({ page }) => {
    await page.goto(\`/test/${componentName.toLowerCase()}?variant=${variant}\`);
    await expect(page).toHaveScreenshot('${componentName.toLowerCase()}-${variant}.png');
  });`).join('\n\n')}

  test('renders in dark mode', async ({ page }) => {
    await page.goto('/test/${componentName.toLowerCase()}?theme=dark');
    await expect(page).toHaveScreenshot('${componentName.toLowerCase()}-dark.png');
  });

  test('renders at mobile breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/test/${componentName.toLowerCase()}');
    await expect(page).toHaveScreenshot('${componentName.toLowerCase()}-mobile.png');
  });
});
`;
  }

  private getDefaultRole(componentName: string): string {
    const roleMap: Record<string, string> = {
      Button: 'button',
      Input: 'textbox',
      Card: 'region',
      Badge: 'status',
      Text: 'text',
    };
    return roleMap[componentName] || 'generic';
  }

  private getDefaultPropValue(prop: string): string {
    const valueMap: Record<string, string> = {
      disabled: 'true',
      loading: 'true',
      variant: '"default"',
      size: '"default"',
      children: '"Test"',
    };
    return valueMap[prop] || 'undefined';
  }

  /**
   * Generate coverage report
   */
  public generateCoverageReport(): string {
    const components = this.discoverComponents();
    const coverage: TestCoverage[] = components.map(c => this.analyzeCoverage(c));
    this.coverageReports = coverage;

    let report = `# 🧪 UI Test Coverage Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    const total = coverage.length;
    const withUnitTests = coverage.filter(c => c.hasUnitTests).length;
    const withIntegrationTests = coverage.filter(c => c.hasIntegrationTests).length;
    const withAccessibilityTests = coverage.filter(c => c.hasAccessibilityTests).length;
    const withVisualTests = coverage.filter(c => c.hasVisualTests).length;

    report += `## 📊 Summary\n\n`;
    report += `- **Total Components:** ${total}\n`;
    report += `- **With Unit Tests:** ${withUnitTests} (${Math.round((withUnitTests / total) * 100)}%)\n`;
    report += `- **With Integration Tests:** ${withIntegrationTests} (${Math.round((withIntegrationTests / total) * 100)}%)\n`;
    report += `- **With Accessibility Tests:** ${withAccessibilityTests} (${Math.round((withAccessibilityTests / total) * 100)}%)\n`;
    report += `- **With Visual Tests:** ${withVisualTests} (${Math.round((withVisualTests / total) * 100)}%)\n\n`;

    report += `## 📋 Component Coverage\n\n`;

    coverage.forEach(c => {
      const missing = [];
      if (!c.hasUnitTests) missing.push('unit');
      if (!c.hasIntegrationTests) missing.push('integration');
      if (!c.hasAccessibilityTests) missing.push('accessibility');
      if (!c.hasVisualTests) missing.push('visual');
      if (c.propsMissing.length > 0) missing.push(`${c.propsMissing.length} props`);

      const status = missing.length === 0 ? '✅' : '⚠️';
      report += `${status} **${c.component}**\n`;
      if (missing.length > 0) {
        report += `   Missing: ${missing.join(', ')}\n`;
      }
      report += `\n`;
    });

    report += `## 🎯 Recommendations\n\n`;
    
    const untestedComponents = coverage.filter(c => !c.hasUnitTests);
    if (untestedComponents.length > 0) {
      report += `### Generate Unit Tests\n\n`;
      untestedComponents.forEach(c => {
        report += `- \`${c.component}\` - Missing unit tests\n`;
      });
      report += `\n`;
    }

    const missingProps = coverage.filter(c => c.propsMissing.length > 0);
    if (missingProps.length > 0) {
      report += `### Test Missing Props\n\n`;
      missingProps.forEach(c => {
        report += `- \`${c.component}\` - Missing tests for: ${c.propsMissing.join(', ')}\n`;
      });
    }

    return report;
  }
}

// CLI
const args = process.argv.slice(2);
const componentIndex = args.indexOf('--component');
const componentName = componentIndex >= 0 && args[componentIndex + 1] ? args[componentIndex + 1] : null;
const generate = args.includes('--generate');
const coverage = args.includes('--coverage');

const supervisor = new TestingSupervisor();

if (coverage) {
  const report = supervisor.generateCoverageReport();
  console.log(report);
  
  const reportPath = path.join(process.cwd(), 'TEST_COVERAGE_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n📄 Report written to: ${reportPath}`);
}

if (generate && componentName) {
  const componentPath = path.join(process.cwd(), `packages/ui/components/${componentName}.tsx`);
  
  if (fs.existsSync(componentPath)) {
    const componentDir = path.dirname(componentPath);
    
    // Generate all test types
    ['unit', 'integration', 'accessibility', 'visual'].forEach(testType => {
      const testCode = supervisor.generateTestFile(componentPath, testType as any);
      const testFileName = `${componentName}.${testType}.test.tsx`;
      const testPath = path.join(componentDir, testFileName);
      
      fs.writeFileSync(testPath, testCode, 'utf-8');
      console.log(`✅ Generated: ${testPath}`);
    });
  } else {
    console.error(`❌ Component not found: ${componentPath}`);
  }
}
