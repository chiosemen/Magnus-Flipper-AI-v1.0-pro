#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const SCOPE = "@magnus-flipper-ai/";
const IGNORE = new Set(["node_modules", ".next", "dist", "build", ".expo", ".turbo", ".pnpm", ".magnus_backups"]);

const pkgs = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (full.split(path.sep).some((p) => IGNORE.has(p))) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (entry === "package.json") pkgs.push(full);
  }
};
walk(ROOT);

const bad = [];
for (const pkg of pkgs) {
  const data = JSON.parse(fs.readFileSync(pkg, "utf8"));
  if (!data.name?.startsWith(SCOPE)) bad.push(path.relative(ROOT, pkg));
}

assert.strictEqual(bad.length, 0, `Packages with wrong scope:\n${bad.join("\n")}`);
console.log("✅ test-namespace-matches-package-json passed");
