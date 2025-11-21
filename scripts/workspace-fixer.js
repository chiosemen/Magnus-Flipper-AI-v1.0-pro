#!/usr/bin/env node
/**
 * Ensures pnpm-workspace.yaml has correct globs and excludes.
 */
const fs = require("fs");
const path = require("path");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const workspacePath = path.join(ROOT, "pnpm-workspace.yaml");

const desired = `packages:
  - "packages/*"
  - "apps/*"
  - "mobile"
  - "web"
  # Exclude standalone-version to avoid duplicate @magnus-flipper-ai/web
  # - "standalone-version/*"
`;

if (!fs.existsSync(workspacePath)) {
  console.error("❌ pnpm-workspace.yaml not found");
  process.exit(1);
}

const current = fs.readFileSync(workspacePath, "utf8");
if (current === desired) {
  console.log("✅ pnpm-workspace.yaml already matches desired configuration");
  process.exit(0);
}

fs.writeFileSync(workspacePath, desired, "utf8");
console.log("✅ pnpm-workspace.yaml rewritten to standard patterns.");
