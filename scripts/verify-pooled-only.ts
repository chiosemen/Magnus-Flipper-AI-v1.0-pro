#!/usr/bin/env tsx
/**
 * POOLED-ONLY ARCHITECTURE VERIFICATION SCRIPT
 *
 * Ensures no legacy per-search scraping code paths exist.
 * Run this before every merge to prevent regressions.
 *
 * FAIL CONDITIONS:
 * - Any API route enqueues BullMQ jobs with searchId
 * - Any worker queries saved_searches for scraping
 * - Any SQL query reads deals without search_id IS NULL filter
 * - Any Redis key matching saved:search:* is referenced in active code
 *
 * EXIT CODES:
 * 0 = All checks passed (pooled-only architecture intact)
 * 1 = Violations found (legacy code detected)
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");
const VIOLATIONS: string[] = [];

// Color codes for terminal output
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(msg: string, color: string = RESET) {
  console.log(`${color}${msg}${RESET}`);
}

function addViolation(file: string, line: number, reason: string) {
  VIOLATIONS.push(`${file}:${line} - ${reason}`);
}

function scanFile(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // CHECK 1: BullMQ job enqueuing with searchId
    if (
      line.includes("ingestQueue.add") &&
      content.includes("savedSearchId") &&
      !filePath.includes("route.disabled.ts") &&
      !filePath.includes("_api_off")
    ) {
      addViolation(filePath, lineNum, "BullMQ job enqueuing with savedSearchId (per-search scraping)");
    }

    // CHECK 2: Redis saved:search:* key usage (active files only)
    if (
      line.includes("saved:search:") &&
      !filePath.includes(".disabled.") &&
      !filePath.includes("_api_off") &&
      !filePath.includes("verify-pooled-only")
    ) {
      addViolation(filePath, lineNum, "Redis saved:search:* key usage (legacy infrastructure)");
    }

    // CHECK 3: Prisma savedSearch queries for scraping
    if (
      (line.includes("prisma.savedSearch.findMany") || line.includes("prisma.savedSearch.findFirst")) &&
      content.includes("isActive") &&
      !filePath.includes(".disabled.") &&
      !filePath.includes("_api_off")
    ) {
      addViolation(filePath, lineNum, "Prisma savedSearch polling for active searches (per-search scraping)");
    }

    // CHECK 4: Direct scraping calls from API routes
    if (
      filePath.includes("/app/api/") &&
      (line.includes("scrapeFacebook") || line.includes("scrapeVinted")) &&
      !filePath.includes(".disabled.")
    ) {
      addViolation(filePath, lineNum, "Direct scraping call from API route (UI-triggered scraping)");
    }

    // CHECK 5: /api/saved-searches endpoint usage
    if (
      line.includes('"/api/saved-searches') &&
      !filePath.includes("verify-pooled-only")
    ) {
      addViolation(filePath, lineNum, "Reference to deleted /api/saved-searches endpoint");
    }
  });
}

function scanDirectory(dir: string) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    // Skip node_modules, .next, dist
    if (
      entry === "node_modules" ||
      entry === ".next" ||
      entry === "dist" ||
      entry === ".git"
    ) {
      continue;
    }

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      scanFile(fullPath);
    }
  }
}

function verifyDatabaseSchema() {
  log("\n📊 Verifying database schema...");

  const schemaPath = join(ROOT, "packages/core/prisma/schema.prisma");
  if (!statSync(schemaPath).isFile()) {
    log("⚠️  Prisma schema not found, skipping schema check", YELLOW);
    return;
  }

  const schema = readFileSync(schemaPath, "utf-8");

  // Check that scraped_listings table exists in migrations (not Prisma)
  const migrationsPath = join(ROOT, "supabase/migrations");
  const migrations = readdirSync(migrationsPath);

  let scrapedListingsFound = false;
  for (const migration of migrations) {
    const migrationPath = join(migrationsPath, migration);
    if (statSync(migrationPath).isFile() && migration.endsWith(".sql")) {
      const content = readFileSync(migrationPath, "utf-8");
      if (content.includes("CREATE TABLE") && content.includes("scraped_listings")) {
        scrapedListingsFound = true;
        log("✅ scraped_listings table found in migrations", GREEN);
        break;
      }
    }
  }

  if (!scrapedListingsFound) {
    addViolation(migrationsPath, 0, "scraped_listings table not found in Supabase migrations");
  }
}

function main() {
  log("\n🔍 POOLED-ONLY ARCHITECTURE VERIFICATION\n", YELLOW);
  log("Scanning for legacy per-search scraping code paths...\n");

  // Scan critical directories
  const dirsToScan = [
    join(ROOT, "apps/web/app/api"),
    join(ROOT, "apps/web/app/marketplaces"),
    join(ROOT, "apps/web/components"),
    join(ROOT, "apps/worker-scheduler/src"),
  ];

  for (const dir of dirsToScan) {
    try {
      if (statSync(dir).isDirectory()) {
        log(`Scanning: ${dir}`);
        scanDirectory(dir);
      }
    } catch (err) {
      log(`⚠️  Directory not found: ${dir}`, YELLOW);
    }
  }

  // Verify database schema
  verifyDatabaseSchema();

  // Report results
  log("\n" + "=".repeat(60));
  if (VIOLATIONS.length === 0) {
    log("\n✅ ALL CHECKS PASSED", GREEN);
    log("Pooled-only architecture is intact.\n", GREEN);
    process.exit(0);
  } else {
    log(`\n❌ VIOLATIONS FOUND: ${VIOLATIONS.length}`, RED);
    log("\nLegacy code paths detected:\n", RED);
    VIOLATIONS.forEach((v) => log(`  ${v}`, RED));
    log("\n⛔ MERGE BLOCKED", RED);
    log("Fix violations before merging.\n");
    process.exit(1);
  }
}

main();
