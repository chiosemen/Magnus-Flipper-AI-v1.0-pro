/**
 * Alert Engine Test Harness
 * Tests alert rules evaluation with sample listings
 */

import {
  evaluateAlertRule,
  type AlertRule,
  type ListingToEvaluate,
} from "../../packages/alert-engine/src/index";

// Sample test data
const sampleListing: ListingToEvaluate = {
  marketplace: "VINTED",
  external_id: "test-123",
  title: "iPhone 15 Pro Max 256GB Unlocked",
  price: 450,
  url: "https://vinted.com/test-123",
  image_url: "https://example.com/image.jpg",
  location: "London, UK",
  condition: "Used - Excellent",
  posted_at: new Date().toISOString(),
};

const testAlertRules: AlertRule[] = [
  // Test 1: Price Drop Alert
  {
    id: "test-price-drop-1",
    user_id: "test-user",
    name: "iPhone 15 Price Drop Alert",
    description: "Notify when iPhone 15 drops below £500",
    alert_type: "PRICE_DROP",
    marketplace: "VINTED",
    search_query: "iphone 15",
    conditions: {
      price_threshold: 500,
      currency: "GBP",
      comparison: "less_than",
      location: "London",
    },
    notification_channels: ["EMAIL", "PUSH"],
    active: true,
    trigger_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Test 2: Keyword Match Alert
  {
    id: "test-keyword-1",
    user_id: "test-user",
    name: "Pro Max Keyword Alert",
    description: "Notify when Pro Max models appear",
    alert_type: "KEYWORD_MATCH",
    conditions: {
      keywords: ["Pro Max", "15 Pro"],
      match_type: "any",
      case_sensitive: false,
    },
    notification_channels: ["EMAIL"],
    active: true,
    trigger_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Test 3: Geo-Location Alert
  {
    id: "test-geo-1",
    user_id: "test-user",
    name: "London Location Alert",
    description: "Notify for items in London area",
    alert_type: "GEO_LOCATION",
    conditions: {
      location: "London",
      radius_km: 10,
    },
    notification_channels: ["EMAIL"],
    active: true,
    trigger_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Test 4: Should NOT trigger (inactive)
  {
    id: "test-inactive-1",
    user_id: "test-user",
    name: "Inactive Alert",
    description: "This should not trigger",
    alert_type: "PRICE_DROP",
    conditions: {
      price_threshold: 1000,
      currency: "GBP",
      comparison: "less_than",
    },
    notification_channels: ["EMAIL"],
    active: false, // INACTIVE
    trigger_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

async function runAlertEngineTests(): Promise<void> {
  console.log("=".repeat(60));
  console.log("ALERT ENGINE TEST HARNESS");
  console.log("=".repeat(60));
  console.log("");

  console.log("📋 Sample Listing:");
  console.log(`   Title: ${sampleListing.title}`);
  console.log(`   Price: £${sampleListing.price}`);
  console.log(`   Location: ${sampleListing.location}`);
  console.log(`   Marketplace: ${sampleListing.marketplace}`);
  console.log("");

  console.log("-".repeat(60));
  console.log("Running Alert Evaluation Tests");
  console.log("-".repeat(60));
  console.log("");

  let passedTests = 0;
  let failedTests = 0;

  for (const rule of testAlertRules) {
    try {
      const result = evaluateAlertRule(rule, sampleListing);

      console.log(`Test: ${rule.name}`);
      console.log(`  Type: ${rule.alert_type}`);
      console.log(`  Active: ${rule.active}`);
      console.log(`  Result: ${result.triggered ? "✓ TRIGGERED" : "✗ NOT TRIGGERED"}`);

      if (result.trigger_reason) {
        console.log(`  Reason: ${result.trigger_reason}`);
      }

      if (result.metadata) {
        console.log(`  Metadata:`, JSON.stringify(result.metadata, null, 2));
      }

      console.log("");

      // Validate expected results
      if (rule.id === "test-inactive-1") {
        // Should NOT trigger (inactive)
        if (!result.triggered) {
          passedTests++;
          console.log("  ✓ Test PASSED (correctly did not trigger)\n");
        } else {
          failedTests++;
          console.log("  ✗ Test FAILED (should not have triggered)\n");
        }
      } else if (rule.alert_type === "PRICE_DROP") {
        // Should trigger (price £450 < £500)
        if (result.triggered) {
          passedTests++;
          console.log("  ✓ Test PASSED (correctly triggered)\n");
        } else {
          failedTests++;
          console.log("  ✗ Test FAILED (should have triggered)\n");
        }
      } else if (rule.alert_type === "KEYWORD_MATCH") {
        // Should trigger (contains "Pro Max")
        if (result.triggered) {
          passedTests++;
          console.log("  ✓ Test PASSED (correctly triggered)\n");
        } else {
          failedTests++;
          console.log("  ✗ Test FAILED (should have triggered)\n");
        }
      } else if (rule.alert_type === "GEO_LOCATION") {
        // Should trigger (location matches London)
        if (result.triggered) {
          passedTests++;
          console.log("  ✓ Test PASSED (correctly triggered)\n");
        } else {
          failedTests++;
          console.log("  ✗ Test FAILED (should have triggered)\n");
        }
      }
    } catch (error: any) {
      console.error(`  ✗ Test FAILED with exception:`, error.message);
      console.log("");
      failedTests++;
    }
  }

  console.log("=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${testAlertRules.length}`);
  console.log(`✓ Passed: ${passedTests}`);
  console.log(`✗ Failed: ${failedTests}`);
  console.log("=".repeat(60));

  if (failedTests === 0) {
    console.log("✓ ALL TESTS PASSED!");
  } else {
    console.log("✗ SOME TESTS FAILED");
  }
}

// Run tests
runAlertEngineTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
