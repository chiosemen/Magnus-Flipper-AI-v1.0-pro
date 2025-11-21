#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const SCOPE = "@magnus-flipper-ai/";
const IGNORE = new Set(["node_modules", ".next", "dist", "build", ".expo", ".turbo", ".pnpm", ".magnus_backups"]);

const packages = new Map(); // name -> file

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (full.split(path.sep).some((p) => IGNORE.has(p))) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (entry === "package.json") {
      const data = JSON.parse(fs.readFileSync(full, "utf8"));
      packages.set(data.name, full);
    }
  }
};
walk(ROOT);

const dependents = new Map();
for (const [name, file] of packages.entries()) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const deps = Object.assign({}, data.dependencies, data.devDependencies, data.peerDependencies, data.optionalDependencies);
  for (const dep of Object.keys(deps || {})) {
    if (dep.startsWith(SCOPE)) {
      dependents.set(dep, (dependents.get(dep) || 0) + 1);
    }
  }
}

const orphans = [];
for (const [name, file] of packages.entries()) {
  if (!name.startsWith(SCOPE)) continue;
  // ignore root monorepo package
  if (name === "@magnus-flipper-ai/monorepo") continue;
  if (!dependents.has(name)) orphans.push(path.relative(ROOT, file));
}

assert.strictEqual(orphans.length, 0, `Orphan packages (no dependents):\n${orphans.join("\n")}`);
console.log("✅ test-orphan-packages passed");
