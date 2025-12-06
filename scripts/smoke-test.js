#!/usr/bin/env node
/**
 * Smoke Test Agent - Production Deployment Verification
 * Tests: flipperagents.com deployment, API health, Lighthouse audit
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TARGET_URL = 'https://flipperagents.com';
const API_URL = 'https://magnus-api.wittystone-f822e1ef.eastus.azurecontainerapps.io/healthz';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
const REPORTS_DIR = path.join(__dirname, '../reports');

// Ensure directories exist
[SCREENSHOT_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const results = {
  timestamp: new Date().toISOString(),
  targetUrl: TARGET_URL,
  apiUrl: API_URL,
  deployment: {},
  browser: {},
  api: {},
  lighthouse: {},
  errors: [],
  warnings: [],
  verdict: 'UNKNOWN'
};

async function testDeployment() {
  console.log('🔍 Testing deployment...');
  
  try {
    const response = await fetch(TARGET_URL, { method: 'HEAD' });
    results.deployment = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      reachable: response.status < 500
    };
    
    if (response.status === 404) {
      results.errors.push('Deployment returns 404 - Not Found');
    }
    if (response.status >= 500) {
      results.errors.push(`Deployment returns ${response.status} - Server Error`);
    }
    
    console.log(`✅ Deployment HTTP Status: ${response.status}`);
  } catch (error) {
    results.errors.push(`Deployment unreachable: ${error.message}`);
    results.deployment.reachable = false;
    console.log(`❌ Deployment unreachable: ${error.message}`);
  }
}

async function testAPI() {
  console.log('🔍 Testing API health...');
  
  try {
    const response = await fetch(API_URL);
    const body = await response.text();
    
    results.api = {
      status: response.status,
      statusText: response.statusText,
      body: body.trim(),
      healthy: response.status === 200 && body.trim() === 'OK',
      responseTime: Date.now() // Will be calculated properly in real implementation
    };
    
    if (results.api.healthy) {
      console.log('✅ API Health: OK');
    } else {
      results.errors.push(`API returned ${response.status}: ${body}`);
      console.log(`❌ API Health: ${response.status} - ${body}`);
    }
  } catch (error) {
    results.errors.push(`API unreachable: ${error.message}`);
    results.api.healthy = false;
    console.log(`❌ API unreachable: ${error.message}`);
  }
}

async function testBrowser() {
  console.log('🔍 Testing browser automation...');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    const page = await context.newPage();
    
    // Collect console messages
    const consoleMessages = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      if (type === 'error') {
        consoleMessages.push({ type: 'error', text });
        results.errors.push(`Console Error: ${text}`);
      } else if (type === 'warning') {
        consoleMessages.push({ type: 'warning', text });
        results.warnings.push(`Console Warning: ${text}`);
      }
    });
    
    page.on('requestfailed', request => {
      const url = request.url();
      const failure = request.failure();
      networkErrors.push({ url, failure: failure?.errorText });
      if (!url.includes('favicon') && !url.includes('analytics')) {
        results.errors.push(`Network Error: ${url} - ${failure?.errorText}`);
      }
    });
    
    // Navigate and wait
    console.log(`📡 Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit for any async content
    await page.waitForTimeout(2000);
    
    // Extract page info
    const title = await page.title();
    const metaDescription = await page.$eval('meta[name="description"]', el => el.content).catch(() => 'Not found');
    const url = page.url();
    
    // Check for error indicators
    const bodyText = await page.textContent('body').catch(() => '');
    const has404 = bodyText.includes('404') || bodyText.includes('Not Found') || title.includes('404');
    const hasGoDaddy = bodyText.includes('GoDaddy') || bodyText.includes('parked') || bodyText.includes('domain');
    const hasDeploymentError = bodyText.includes('Deployment Not Found') || bodyText.includes('DEPLOYMENT_NOT_FOUND');
    
    if (has404) {
      results.errors.push('404 page detected');
    }
    if (hasGoDaddy) {
      results.errors.push('GoDaddy placeholder detected');
    }
    if (hasDeploymentError) {
      results.errors.push('Vercel "Deployment Not Found" error detected');
    }
    
    // Capture screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, 'home.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    results.browser = {
      title,
      metaDescription,
      url,
      has404,
      hasGoDaddy,
      hasDeploymentError,
      consoleMessages,
      networkErrors: networkErrors.filter(e => !e.url.includes('favicon')),
      screenshot: screenshotPath
    };
    
    console.log(`✅ Browser test completed`);
    console.log(`   Title: ${title}`);
    console.log(`   Console errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
    console.log(`   Network errors: ${networkErrors.length}`);
    
  } catch (error) {
    results.errors.push(`Browser test failed: ${error.message}`);
    console.log(`❌ Browser test failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testLighthouse() {
  console.log('🔍 Running Lighthouse audit...');
  
  try {
    // Check if lighthouse CLI is available
    try {
      execSync('which lighthouse', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  Lighthouse CLI not found, skipping audit');
      results.lighthouse = { skipped: true, reason: 'Lighthouse CLI not installed' };
      return;
    }
    
    const lighthousePath = path.join(REPORTS_DIR, 'lighthouse-flipperagents.json');
    const command = `lighthouse ${TARGET_URL} --output=json --output-path=${lighthousePath} --chrome-flags="--headless" --quiet`;
    
    execSync(command, { stdio: 'inherit', timeout: 120000 });
    
    if (fs.existsSync(lighthousePath)) {
      const report = JSON.parse(fs.readFileSync(lighthousePath, 'utf8'));
      const categories = report.categories || {};
      
      results.lighthouse = {
        performance: Math.round(categories.performance?.score * 100 || 0),
        accessibility: Math.round(categories.accessibility?.score * 100 || 0),
        bestPractices: Math.round(categories['best-practices']?.score * 100 || 0),
        seo: Math.round(categories.seo?.score * 100 || 0),
        reportPath: lighthousePath
      };
      
      console.log('✅ Lighthouse audit completed');
      console.log(`   Performance: ${results.lighthouse.performance}/100`);
      console.log(`   Accessibility: ${results.lighthouse.accessibility}/100`);
      console.log(`   Best Practices: ${results.lighthouse.bestPractices}/100`);
      console.log(`   SEO: ${results.lighthouse.seo}/100`);
    }
  } catch (error) {
    results.warnings.push(`Lighthouse audit failed: ${error.message}`);
    console.log(`⚠️  Lighthouse audit failed: ${error.message}`);
  }
}

function generateReport() {
  console.log('📝 Generating report...');
  
  // Determine verdict
  const hasCriticalErrors = results.errors.length > 0 || 
                           results.deployment.status === 404 ||
                           results.browser.has404 ||
                           results.browser.hasDeploymentError ||
                           !results.api.healthy;
  
  results.verdict = hasCriticalErrors ? 'FAIL' : 'PASS';
  
  const report = `# Post-Deployment Smoke Test Report

**Generated:** ${results.timestamp}  
**Target URL:** ${results.targetUrl}  
**Verdict:** ${results.verdict === 'PASS' ? '🟢 PASS' : '🔴 FAIL'}

---

## Executive Summary

${results.verdict === 'PASS' ? '✅ All smoke tests passed. Deployment is healthy and accessible.' : '❌ Critical issues detected. Deployment requires attention.'}

---

## 1. Deployment Status

**HTTP Status:** ${results.deployment.status || 'Unknown'} ${results.deployment.statusText || ''}  
**Reachable:** ${results.deployment.reachable !== false ? '✅ Yes' : '❌ No'}

${results.deployment.status === 404 ? '⚠️ **CRITICAL:** Deployment returns 404 - Not Found' : ''}
${results.deployment.status >= 500 ? '⚠️ **CRITICAL:** Deployment returns server error' : ''}

---

## 2. Browser Automation Results

**Page Title:** ${results.browser.title || 'Not loaded'}  
**URL:** ${results.browser.url || 'Not loaded'}  
**Meta Description:** ${results.browser.metaDescription || 'Not found'}

### Error Detection

${results.browser.has404 ? '❌ **404 page detected**' : '✅ No 404 detected'}  
${results.browser.hasGoDaddy ? '❌ **GoDaddy placeholder detected**' : '✅ No GoDaddy placeholder'}  
${results.browser.hasDeploymentError ? '❌ **Vercel "Deployment Not Found" error**' : '✅ No deployment errors'}

### Console Messages

**Errors:** ${results.browser.consoleMessages?.filter(m => m.type === 'error').length || 0}  
**Warnings:** ${results.browser.consoleMessages?.filter(m => m.type === 'warning').length || 0}

${results.browser.consoleMessages?.filter(m => m.type === 'error').length > 0 ? `
#### Console Errors:
${results.browser.consoleMessages.filter(m => m.type === 'error').map(m => `- ${m.text}`).join('\n')}
` : ''}

### Network Errors

**Failed Requests:** ${results.browser.networkErrors?.length || 0}

${results.browser.networkErrors?.length > 0 ? `
#### Failed Network Requests:
${results.browser.networkErrors.map(e => `- ${e.url}: ${e.failure}`).join('\n')}
` : ''}

### Screenshot

Screenshot saved to: \`${results.browser.screenshot || 'Not captured'}\`

---

## 3. API Health Check

**Endpoint:** ${results.apiUrl}  
**Status:** ${results.api.status || 'Unknown'} ${results.api.statusText || ''}  
**Response Body:** ${results.api.body || 'No response'}  
**Healthy:** ${results.api.healthy ? '✅ Yes' : '❌ No'}

---

## 4. Lighthouse Audit

${results.lighthouse.skipped ? '⚠️ Lighthouse audit skipped (CLI not installed)' : ''}

${!results.lighthouse.skipped ? `
**Performance:** ${results.lighthouse.performance}/100  
**Accessibility:** ${results.lighthouse.accessibility}/100  
**Best Practices:** ${results.lighthouse.bestPractices}/100  
**SEO:** ${results.lighthouse.seo}/100

Full report: \`${results.lighthouse.reportPath}\`
` : ''}

---

## 5. Critical Issues

${results.errors.length === 0 ? '✅ No critical issues detected.' : results.errors.map(e => `- ❌ ${e}`).join('\n')}

---

## 6. Warnings

${results.warnings.length === 0 ? '✅ No warnings.' : results.warnings.map(w => `- ⚠️ ${w}`).join('\n')}

---

## 7. Recommendations

${results.verdict === 'FAIL' ? `
### Immediate Actions Required:

1. **Fix Deployment Issues:**
   ${results.deployment.status === 404 ? '- Deploy a successful production build to Vercel' : ''}
   ${results.browser.hasDeploymentError ? '- Verify Vercel project is linked and deployment succeeded' : ''}
   ${results.browser.hasGoDaddy ? '- Verify DNS records are correctly pointing to Vercel' : ''}

2. **Fix API Issues:**
   ${!results.api.healthy ? '- Check Azure Container App health and logs' : ''}

3. **Fix Browser Errors:**
   ${results.browser.consoleMessages?.filter(m => m.type === 'error').length > 0 ? '- Review and fix JavaScript console errors' : ''}
   ${results.browser.networkErrors?.length > 0 ? '- Fix failed network requests (check API endpoints, assets)' : ''}
` : `
### Optimization Opportunities:

${results.lighthouse.performance < 80 ? '- Improve performance score (currently ' + results.lighthouse.performance + '/100)' : ''}
${results.lighthouse.accessibility < 90 ? '- Improve accessibility score (currently ' + results.lighthouse.accessibility + '/100)' : ''}
${results.browser.consoleMessages?.filter(m => m.type === 'warning').length > 0 ? '- Address console warnings for better code quality' : ''}
`}

---

## Next Steps

${results.verdict === 'PASS' ? `
✅ **Deployment is healthy and ready for production use.**

Monitor:
- Vercel deployment logs
- Azure API health
- User-reported issues
` : `
❌ **Deployment requires fixes before production use.**

1. Address all critical issues listed above
2. Re-run smoke tests after fixes
3. Verify all tests pass before announcing launch
`}

---

**Report Generated By:** Smoke Test Agent  
**Test Duration:** ~${Math.round((Date.now() - new Date(results.timestamp).getTime()) / 1000)}s
`;

  const reportPath = path.join(__dirname, '../POST_DEPLOYMENT_SMOKE_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Report saved: ${reportPath}`);
  
  return reportPath;
}

async function main() {
  console.log('🚀 Starting Smoke Test Agent...\n');
  console.log(`Target URL: ${TARGET_URL}`);
  console.log(`API URL: ${API_URL}\n`);
  
  await testDeployment();
  await testAPI();
  await testBrowser();
  await testLighthouse();
  
  const reportPath = generateReport();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Verdict: ${results.verdict === 'PASS' ? '🟢 PASS' : '🔴 FAIL'}`);
  console.log(`Report: ${reportPath}`);
  console.log(`${'='.repeat(60)}\n`);
  
  process.exit(results.verdict === 'PASS' ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Smoke test failed:', error);
  process.exit(1);
});

