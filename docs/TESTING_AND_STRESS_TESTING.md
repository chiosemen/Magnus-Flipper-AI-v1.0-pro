# 🧪 Testing Supervisor & Layout Stress Tester

Complete guide for UI testing coverage and visual QA automation.

---

## 🟣 Agent 4: Testing Supervisor ✅

**File:** `.cursor/agents/magnus-testing-supervisor.json`  
**Script:** `scripts/testing-supervisor.ts`  
**Command:** `pnpm test:supervise`

### Capabilities

✅ Analyzes component test coverage  
✅ Generates unit, integration, accessibility, and visual tests  
✅ Detects missing test cases  
✅ Validates test quality  
✅ Generates coverage reports  
✅ Ensures 100% UI coverage  

### Usage

**In Cursor:**
```
Supervise UI Testing
Generate test coverage report
Create tests for Button component
Audit test coverage
Ensure 100% coverage
```

**Via Script:**
```bash
# Generate coverage report
pnpm test:supervise

# Generate tests for specific component
pnpm test:generate --component Button

# Generate all test types
pnpm test:generate --component Button
```

### Test Types Generated

1. **Unit Tests** (`Component.test.tsx`)
   - Component rendering
   - Props handling
   - Variant combinations
   - State management
   - Basic interactions

2. **Integration Tests** (`Component.integration.test.tsx`)
   - User interactions
   - Form integration
   - Keyboard navigation
   - Event handling

3. **Accessibility Tests** (`Component.accessibility.test.tsx`)
   - WCAG 2.1 AA compliance
   - ARIA attributes
   - Keyboard navigation
   - Screen reader compatibility

4. **Visual Tests** (`Component.visual.test.tsx`)
   - Visual regression
   - Screenshot comparison
   - Dark mode variants
   - Responsive breakpoints

### Output

- `TEST_COVERAGE_REPORT.md` - Comprehensive coverage analysis
- `Component.test.tsx` - Unit tests
- `Component.integration.test.tsx` - Integration tests
- `Component.accessibility.test.tsx` - Accessibility tests
- `Component.visual.test.tsx` - Visual regression tests

---

## 🔥 Agent 5: Layout Stress Tester ✅

**File:** `.cursor/agents/magnus-layout-stress-tester.json`  
**Script:** `scripts/layout-stress-tester.ts`  
**Command:** `pnpm stress:test`

### Capabilities

✅ Visual regression testing  
✅ Responsive breakpoint validation  
✅ Dark mode visual consistency  
✅ Layout overflow detection  
✅ Spacing/alignment validation  
✅ Component stress testing  
✅ Performance metrics  
✅ Accessibility visual checks  

### Usage

**In Cursor:**
```
Stress test layouts
Run visual QA
Test responsive breakpoints
Validate dark mode visuals
Check layout overflow
Test component stress cases
```

**Via Script:**
```bash
# Generate visual test for component
pnpm stress:test --component Button

# Generate tests for all breakpoints and dark mode
pnpm stress:visual --component Button

# Generate stress test checklist
pnpm stress:test --component Button
```

### Breakpoints Tested

- **xs:** 375px (Mobile portrait)
- **sm:** 640px (Mobile landscape)
- **md:** 768px (Tablet portrait)
- **lg:** 1024px (Tablet landscape)
- **xl:** 1280px (Desktop)
- **2xl:** 1440px (Large desktop)

### Stress Test Scenarios

1. **Long Content** - Extremely long text
2. **Many Items** - Large lists/tables
3. **Empty State** - No data scenarios
4. **Loading State** - Skeleton loaders
5. **Error State** - Error messages
6. **Extreme Values** - Very long strings
7. **Nested Components** - Deep nesting

### Output

- `tests/visual/Component.visual.test.ts` - Playwright visual tests
- `STRESS_TEST_CHECKLIST_Component.md` - Test checklist
- Screenshot comparisons
- Performance metrics
- Layout violation reports

---

## 🚀 Quick Start

### Testing Supervisor

```bash
# 1. Check current coverage
pnpm test:supervise

# 2. Generate tests for component
pnpm test:generate --component Button

# 3. Review generated tests
cat packages/ui/components/Button.test.tsx

# 4. Run tests
pnpm test Button
```

### Layout Stress Tester

```bash
# 1. Generate visual tests
pnpm stress:visual --component Button

# 2. Review generated test file
cat tests/visual/Button.visual.test.ts

# 3. Run visual tests (requires Playwright)
npx playwright test tests/visual/Button.visual.test.ts

# 4. Review checklist
cat STRESS_TEST_CHECKLIST_Button.md
```

---

## 📋 Test Coverage Targets

### Unit Tests
- ✅ 100% component rendering
- ✅ All props tested
- ✅ All variants tested
- ✅ All states tested (loading, disabled, error)

### Integration Tests
- ✅ All user interactions
- ✅ Form integration
- ✅ Keyboard navigation
- ✅ Event handlers

### Accessibility Tests
- ✅ WCAG 2.1 AA compliance
- ✅ ARIA attributes
- ✅ Keyboard navigation
- ✅ Screen reader support

### Visual Tests
- ✅ All breakpoints
- ✅ Light and dark modes
- ✅ All variants
- ✅ Stress cases

---

## 🎯 Workflow Examples

### Example 1: New Component Testing

```bash
# 1. Create component
# packages/ui/components/NewComponent.tsx

# 2. Generate all tests
pnpm test:generate --component NewComponent

# 3. Review coverage
pnpm test:supervise

# 4. Generate visual tests
pnpm stress:visual --component NewComponent

# 5. Run all tests
pnpm test NewComponent
npx playwright test tests/visual/NewComponent.visual.test.ts
```

### Example 2: Pre-Deployment QA

```bash
# 1. Check coverage
pnpm test:supervise

# 2. Run stress tests on critical components
pnpm stress:visual --component AppShell
pnpm stress:visual --component Navbar
pnpm stress:visual --component Button

# 3. Review reports
cat TEST_COVERAGE_REPORT.md
cat STRESS_TEST_CHECKLIST_*.md

# 4. Fix issues and re-test
```

### Example 3: Accessibility Audit

```bash
# 1. Generate accessibility tests
pnpm test:generate --component Button

# 2. Run accessibility tests
pnpm test Button.accessibility.test.tsx

# 3. Review violations
# Tests use jest-axe for WCAG compliance
```

---

## 🔧 Configuration

### Test Frameworks Required

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-axe": "^8.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### Jest Configuration

Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@magnus-flipper-ai/ui/(.*)$': '<rootDir>/packages/ui/$1',
  },
};
```

### Playwright Configuration

Create `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

---

## 📊 Coverage Reports

### Coverage Report Format

```
# 🧪 UI Test Coverage Report

## 📊 Summary
- Total Components: 15
- With Unit Tests: 12 (80%)
- With Integration Tests: 8 (53%)
- With Accessibility Tests: 10 (67%)
- With Visual Tests: 5 (33%)

## 📋 Component Coverage
✅ Button - All tests present
⚠️ Input - Missing: integration, visual
...
```

### Stress Test Report Format

```
# 🔥 Layout Stress Test Report: Button

## 📊 Summary
- Total Tests: 12
- Passed: 10 (83%)
- Failed: 2 (17%)
- Critical Issues: 1
- High Priority Issues: 1

## 📋 Test Results by Breakpoint
### xs (375x667)
✅ light mode
✅ dark mode
...
```

---

## ✅ Status

**Testing Supervisor:** ✅ Complete  
**Layout Stress Tester:** ✅ Complete  
**Scripts:** ✅ Executable  
**Documentation:** ✅ Complete  
**NPM Commands:** ✅ Added  

---

## 🎓 Next Steps

1. **Install test dependencies:**
   ```bash
   pnpm add -D @testing-library/react @testing-library/jest-dom jest-axe @playwright/test
   ```

2. **Generate tests:**
   ```bash
   pnpm test:generate --component Button
   ```

3. **Run stress tests:**
   ```bash
   pnpm stress:visual --component Button
   ```

4. **Review coverage:**
   ```bash
   pnpm test:supervise
   ```

---

**Both agents are ready for comprehensive UI testing!** 🚀
