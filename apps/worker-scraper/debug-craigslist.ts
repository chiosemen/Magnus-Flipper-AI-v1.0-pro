/**
 * Quick debug script to check Craigslist page structure
 */

import { chromium } from "playwright";

async function debugCraigslist() {
  console.log("🔍 Debugging Craigslist page structure...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = "https://sfbay.craigslist.org/search/sss?query=laptop&sort=date";

  console.log(`📍 Navigating to: ${url}\n`);

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    console.log("✅ Page loaded successfully\n");

    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}\n`);

    // Try different selectors
    const selectors = [
      "li.cl-search-result",
      "li.cl-static-search-result",
      "li.result-row",
      ".cl-search-result",
      ".result-row",
      "li[class*='result']",
      "li[class*='search']",
    ];

    console.log("🔎 Testing selectors:\n");
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`   ${selector}: ${count} elements`);
    }

    // Find gallery/grid items
    console.log("\n🔍 Searching for listing elements...\n");

    const gallerySelectors = [
      "li.cl-static-search-result",
      "div.cl-static-search-result",
      "div[class*='gallery']",
      "div[class*='result-']",
      "li[class*='result']",
      "a[href*='.html']", // Craigslist listing links
    ];

    for (const selector of gallerySelectors) {
      const count = await page.locator(selector).count();
      console.log(`   ${selector}: ${count} elements`);
    }

    // Get first few listing links to understand structure
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a[href*='.html']"));
      return anchors.slice(0, 10).map((a) => ({
        href: a.getAttribute("href"),
        text: a.textContent?.trim().substring(0, 80),
        parent: a.parentElement?.className,
        grandparent: a.parentElement?.parentElement?.className,
      }));
    });

    console.log("\n📋 First 10 listing links found:\n");
    links.forEach((link, i) => {
      console.log(`   ${i + 1}. ${link.text}`);
      console.log(`      Link: ${link.href}`);
      console.log(`      Parent class: ${link.parent}`);
      console.log(`      Grandparent class: ${link.grandparent}\n`);
    });

    // Try to extract a sample listing structure
    const sampleListing = await page.evaluate(() => {
      const firstLink = document.querySelector("a[href*='.html']");
      if (!firstLink) return null;

      const container = firstLink.closest("li, div");
      if (!container) return null;

      return {
        containerTag: container.tagName,
        containerClass: container.className,
        priceSelector: container.querySelector("[class*='price']")?.className,
        titleSelector: firstLink.className,
        timeSelector: container.querySelector("time")?.className,
        imageSelector: container.querySelector("img")?.className,
      };
    });

    console.log("📦 Sample listing structure:\n");
    console.log(JSON.stringify(sampleListing, null, 2));

    await page.screenshot({ path: "/tmp/craigslist-debug.png" });
    console.log("\n📸 Screenshot saved to: /tmp/craigslist-debug.png\n");
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}\n`);
  } finally {
    await browser.close();
  }
}

debugCraigslist();
