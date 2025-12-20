import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

function safeRun(cmd) {
  try {
    return run(cmd);
  } catch (err) {
    const out = (err?.stdout ?? "").toString();
    return out.trim();
  }
}

function assertNoMatches(label, cmd) {
  const out = safeRun(cmd);
  if (out.length > 0) {
    console.error(`FAIL: ${label}\n${out}\n`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

function assertAllFilesAreDevGated(label, cmd) {
  const out = safeRun(cmd);
  if (out.length === 0) {
    console.log(`PASS: ${label} (no matches)`);
    return;
  }

  const files = Array.from(
    new Set(
      out
        .split("\n")
        .map((line) => line.split(":")[0])
        .filter(Boolean)
    )
  );

  const offenders = [];
  for (const file of files) {
    const contents = readFileSync(file, "utf8");
    if (!contents.includes("blockUnlessDevAdmin(")) offenders.push(file);
  }

  if (offenders.length > 0) {
    console.error(`FAIL: ${label} (missing dev gate)\n- ${offenders.join("\n- ")}\n`);
    process.exitCode = 1;
    return;
  }

  console.log(`PASS: ${label}`);
}

console.log("Pooled-only smoke checks\n");

// Worker entrypoint must not import/run per-search scraping loops.
assertNoMatches(
  "worker-scheduler entrypoint has no Prisma/per-search references",
  `rg -n "PrismaClient|@prisma/client|savedSearch\\.findMany|runFacebookScrapingJob|runVintedScrapingJob|saved:search|ingestQueue" apps/worker-scheduler/src/index.ts -S`
);

// UI must not call scrape-trigger routes in core pages.
assertNoMatches(
  "facebook marketplace page does not call scrape-trigger APIs",
  `rg -n "/api/(ingest|apify|saved-searches|refresh)/" apps/web/app/marketplaces/facebook -S`
);

// Any API route that enqueues jobs must be gated behind dev-only admin guard.
assertAllFilesAreDevGated(
  "job-enqueue API routes are dev-gated",
  `rg -n "(ingestQueue\\.add|fbScrapeQueue\\.add)" apps/web/app/api -S`
);

if (process.exitCode && process.exitCode !== 0) {
  console.error("\nOne or more pooled-only invariants failed.");
  process.exit(process.exitCode);
}

console.log("\nAll pooled-only smoke checks passed.");

