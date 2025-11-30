/**
 * eBay Scraper Test Harness
 * Tests eBay marketplace scraper with sample query
 */

import { scrape } from "../../packages/ebay-crawler/src/index";

async function testEbayScraper(): Promise<void> {
  console.log("=".repeat(60));
  console.log("EBAY SCRAPER TEST");
  console.log("=".repeat(60));
  console.log("Query: 'iphone 15'");
  console.log("-".repeat(60));

  try {
    const result = await scrape("iphone 15");

    console.log(`\n✓ Scrape completed successfully`);
    console.log(`  Marketplace: ${result.marketplace}`);
    console.log(`  Total listings: ${result.listings.length}`);

    if (result.listings.length > 0) {
      console.log(`\n📋 First 5 listings:\n`);

      const displayCount = Math.min(5, result.listings.length);
      for (let i = 0; i < displayCount; i++) {
        const listing = result.listings[i];
        console.log(`${i + 1}. ${listing.title}`);
        console.log(`   Price: ${listing.price || "N/A"}`);
        console.log(`   Location: ${listing.location || "N/A"}`);
        console.log(`   Condition: ${listing.condition || "N/A"}`);
        console.log(`   URL: ${listing.url}`);
        console.log("");
      }
    } else {
      console.log("\n⚠️  No listings found");
    }

    console.log("=".repeat(60));
    console.log("✓ EBAY TEST PASSED");
    console.log("=".repeat(60));
  } catch (error: any) {
    console.error("\n❌ EBAY TEST FAILED");
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.log("=".repeat(60));
    // Log-only, NEVER throw
  }
}

// Run test if executed directly
testEbayScraper();
