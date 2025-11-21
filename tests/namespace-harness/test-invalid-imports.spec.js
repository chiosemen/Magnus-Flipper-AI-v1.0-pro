#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const IGNORE = new Set(["node_modules", ".next", "dist", "build", ".expo", ".turbo", ".pnpm", ".magnus_backups"]);

const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (full.split(path.sep).some((p) => IGNORE.has(p))) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(full)) files.push(full);
  }
};
walk(ROOT);

const offenders = files.filter((f) =>
  /@magnus\/|@magnus-flipper\//.test(fs.readFileSync(f, "utf8"))
);

assert.strictEqual(offenders.length, 0, `Old scope imports found:\n${offenders.map((f) => path.relative(ROOT, f)).join("\n")}`);
console.log("✅ test-invalid-imports passed");
