#!/usr/bin/env ts-node

/**
 * Layout Stress Tester Script
 * 
 * Performs automated visual QA, responsive breakpoint testing, and layout stress testing
 * 
 * Usage:
 *   ts-node scripts/layout-stress-tester.ts [--component <name>] [--breakpoints] [--dark-mode]
 */

import * as fs from 'fs';
import * as path from 'path';

interface StressTestResult {
  component: string;
  breakpoint: string;
  mode: 'light' | 'dark';
  issues: Array<{
    type: 'overflow' | 'alignment' | 'spacing' | 'contrast' | 'performance';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    details?: string;
  }>;
  screenshots: {
    baseline?: string;
    current?: string;
    diff?: string;
  };
  metrics: {
    renderTime: number;
    layoutShift: number;
    paintTime: number;
  };
}

interface BreakpointConfig {
  name: string;
  width: number;
  height: number;
}

class LayoutStressTester {
  private breakpoints: BreakpointConfig[] = [
    { name: 'xs', width: 375, height: 667 },
    { name: 'sm', width: 640, height: 800 },
    { name: 'md', width: 768, height: 1024 },
    { name: 'lg', width: 1024, height: 768 },
    { name: 'xl', width: 1280, height: 720 },
    { name: '2xl', width: 1440, height: 900 },
  ];

  /**
   * Generate Playwright test file for visual regression
   */
  public generateVisualTest(componentName: string): string {
    return `import { test, expect } from '@playwright/test';

test.describe('${componentName} Visual Regression', () => {
  const breakpoints = [
    { name: 'xs', width: 375, height: 667 },
    { name: 'sm', width: 640, height: 800 },
    { name: 'md', width: 768, height: 1024 },
    { name: 'lg', width: 1024, height: 768 },
    { name: 'xl', width: 1280, height: 720 },
    { name: '2xl', width: 1440, height: 900 },
  ];

  test.describe('Light Mode', () => {
    breakpoints.forEach(({ name, width, height }) => {
      test(\`renders correctly at \${name} breakpoint\`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/test/${componentName.toLowerCase()}?theme=light');
        await expect(page).toHaveScreenshot(\`${componentName.toLowerCase()}-light-\${name}.png\`);
      });
    });
  });

  test.describe('Dark Mode', () => {
    breakpoints.forEach(({ name, width, height }) => {
      test(\`renders correctly at \${name} breakpoint\`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/test/${componentName.toLowerCase()}?theme=dark');
        await expect(page).toHaveScreenshot(\`${componentName.toLowerCase()}-dark-\${name}.png\`);
      });
    });
  });

  test.describe('Stress Cases', () => {
    test('handles long content', async ({ page }) => {
      await page.goto('/test/${componentName.toLowerCase()}?content=long');
      await expect(page).toHaveScreenshot(\`${componentName.toLowerCase()}-long-content.png\`);
    });

    test('handles empty state', async ({ page }) => {
      await page.goto('/test/${componentName.toLowerCase()}?state=empty');
      await expect(page).toHaveScreenshot(\`${componentName.toLowerCase()}-empty.png\`);
    });

    test('handles loading state', async ({ page }) => {
      await page.goto('/test/${componentName.toLowerCase()}?state=loading');
      await expect(page).toHaveScreenshot(\`${componentName.toLowerCase()}-loading.png\`);
    });

    test('handles error state', async ({ page }) => {
      await page.goto('/test/${componentName.toLowerCase()}?state=error');
      await expect(page).toHaveScreenshot(\`${componentName.toLowerCase()}-error.png\`);
    });
  });

  test.describe('Layout Validation', () => {
    test('has no horizontal overflow', async ({ page }) => {
      await page.goto('/test/${componentName.toLowerCase()}');
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.viewportSize()?.width || 0;
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });

    test('maintains spacing consistency', async ({ page }) => {
      await page.goto('/test/${componentName.toLowerCase()}');
      // Add spacing validation logic
    });

    test('has proper contrast ratios', async ({ page }) => {
      await page.goto('/test/${componentName.toLowerCase()}');
      // Add contrast validation using axe or custom logic
    });
  });
});
`;
  }

  /**
   * Generate stress test scenarios
   */
  public generateStressScenarios(): Array<{ name: string; description: string; test: string }> {
    return [
      {
        name: 'Long Content',
        description: 'Test component with extremely long text content',
        test: `test('handles long content', async ({ page }) => {
  const longText = 'A'.repeat(1000);
  await page.goto(\`/test/component?content=\${encodeURIComponent(longText)}\`);
  await expect(page.locator('[data-testid="content"]')).not.toHaveCSS('overflow', 'visible');
});`,
      },
      {
        name: 'Many Items',
        description: 'Test component with many child elements',
        test: `test('handles many items', async ({ page }) => {
  await page.goto('/test/component?items=100');
  const items = await page.locator('[data-testid="item"]').count();
  expect(items).toBe(100);
  // Check for performance issues
  const renderTime = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);
  expect(renderTime).toBeLessThan(3000);
});`,
      },
      {
        name: 'Empty State',
        description: 'Test component with no data',
        test: `test('handles empty state', async ({ page }) => {
  await page.goto('/test/component?state=empty');
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
});`,
      },
      {
        name: 'Loading State',
        description: 'Test component loading skeleton',
        test: `test('handles loading state', async ({ page }) => {
  await page.goto('/test/component?state=loading');
  await expect(page.locator('[data-testid="skeleton"]')).toBeVisible();
});`,
      },
      {
        name: 'Error State',
        description: 'Test component error handling',
        test: `test('handles error state', async ({ page }) => {
  await page.goto('/test/component?state=error');
  await expect(page.locator('[data-testid="error"]')).toBeVisible();
});`,
      },
    ];
  }

  /**
   * Generate layout validation checklist
   */
  public generateLayoutChecklist(componentName: string): string {
    return `# Layout Stress Test Checklist: ${componentName}

## ✅ Visual Regression

- [ ] Light mode screenshots captured
- [ ] Dark mode screenshots captured
- [ ] All breakpoints tested (xs, sm, md, lg, xl, 2xl)
- [ ] Screenshots compared against baseline
- [ ] Visual diffs reviewed

## ✅ Responsive Breakpoints

- [ ] xs (375px) - Mobile portrait
- [ ] sm (640px) - Mobile landscape
- [ ] md (768px) - Tablet portrait
- [ ] lg (1024px) - Tablet landscape
- [ ] xl (1280px) - Desktop
- [ ] 2xl (1440px) - Large desktop

## ✅ Layout Validation

- [ ] No horizontal overflow
- [ ] No vertical overflow (unless intentional)
- [ ] Proper spacing consistency
- [ ] Grid alignment correct
- [ ] Flex alignment correct
- [ ] Text overflow handled (ellipsis, wrap)
- [ ] Images scale correctly
- [ ] Containers respect max-width

## ✅ Dark Mode

- [ ] Colors match design tokens
- [ ] Contrast ratios meet WCAG AA
- [ ] No hardcoded colors
- [ ] Shadows visible in dark mode
- [ ] Borders visible in dark mode

## ✅ Stress Cases

- [ ] Long content (text overflow)
- [ ] Many items (list pagination)
- [ ] Empty state (no data)
- [ ] Loading state (skeletons)
- [ ] Error state (error messages)
- [ ] Extreme values (very long strings)
- [ ] Nested components (deep nesting)

## ✅ Performance

- [ ] Render time < 100ms
- [ ] Layout shift < 0.1
- [ ] Paint time < 50ms
- [ ] No memory leaks
- [ ] Smooth animations (60fps)

## ✅ Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Text readable at all sizes
`;
  }

  /**
   * Generate comprehensive stress test report
   */
  public generateStressReport(componentName: string, results: StressTestResult[]): string {
    let report = `# 🔥 Layout Stress Test Report: ${componentName}\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    const totalTests = results.length;
    const passedTests = results.filter(r => r.issues.length === 0).length;
    const failedTests = totalTests - passedTests;

    report += `## 📊 Summary\n\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)\n`;
    report += `- **Failed:** ${failedTests} (${Math.round((failedTests / totalTests) * 100)}%)\n\n`;

    const criticalIssues = results.flatMap(r => r.issues.filter(i => i.severity === 'critical'));
    const highIssues = results.flatMap(r => r.issues.filter(i => i.severity === 'high'));

    report += `- **Critical Issues:** ${criticalIssues.length}\n`;
    report += `- **High Priority Issues:** ${highIssues.length}\n\n`;

    if (criticalIssues.length > 0) {
      report += `## 🔴 Critical Issues\n\n`;
      criticalIssues.forEach(issue => {
        report += `- **${issue.type}**: ${issue.message}\n`;
        if (issue.details) report += `  - ${issue.details}\n`;
      });
      report += `\n`;
    }

    report += `## 📋 Test Results by Breakpoint\n\n`;

    this.breakpoints.forEach(bp => {
      const bpResults = results.filter(r => r.breakpoint === bp.name);
      report += `### ${bp.name} (${bp.width}x${bp.height})\n\n`;
      
      bpResults.forEach(result => {
        const status = result.issues.length === 0 ? '✅' : '❌';
        report += `${status} **${result.mode} mode**\n`;
        
        if (result.issues.length > 0) {
          result.issues.forEach(issue => {
            const icon = issue.severity === 'critical' ? '🔴' : 
                        issue.severity === 'high' ? '🟠' : 
                        issue.severity === 'medium' ? '🟡' : '🟢';
            report += `   ${icon} ${issue.type}: ${issue.message}\n`;
          });
        }
        report += `\n`;
      });
    });

    report += `## 📈 Performance Metrics\n\n`;
    results.forEach(result => {
      report += `### ${result.component} - ${result.breakpoint} - ${result.mode}\n`;
      report += `- Render Time: ${result.metrics.renderTime}ms\n`;
      report += `- Layout Shift: ${result.metrics.layoutShift}\n`;
      report += `- Paint Time: ${result.metrics.paintTime}ms\n\n`;
    });

    return report;
  }
}

// CLI
const args = process.argv.slice(2);
const componentIndex = args.indexOf('--component');
const componentName = componentIndex >= 0 && args[componentIndex + 1] ? args[componentIndex + 1] : 'Button';
const breakpoints = args.includes('--breakpoints');
const darkMode = args.includes('--dark-mode');

const tester = new LayoutStressTester();

if (breakpoints || darkMode || componentName) {
  // Generate visual test file
  const testCode = tester.generateVisualTest(componentName);
  const testPath = path.join(process.cwd(), `tests/visual/${componentName}.visual.test.ts`);
  
  // Ensure directory exists
  const testDir = path.dirname(testPath);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  fs.writeFileSync(testPath, testCode, 'utf-8');
  console.log(`✅ Generated visual test: ${testPath}`);

  // Generate checklist
  const checklist = tester.generateLayoutChecklist(componentName);
  const checklistPath = path.join(process.cwd(), `STRESS_TEST_CHECKLIST_${componentName}.md`);
  fs.writeFileSync(checklistPath, checklist, 'utf-8');
  console.log(`✅ Generated checklist: ${checklistPath}`);

  // Generate stress scenarios
  const scenarios = tester.generateStressScenarios();
  console.log(`\n📋 Stress Test Scenarios:\n`);
  scenarios.forEach(s => {
    console.log(`- ${s.name}: ${s.description}`);
  });
}
