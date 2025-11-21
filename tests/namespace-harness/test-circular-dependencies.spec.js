#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const SCOPE = "@magnus-flipper-ai/";
const IGNORE = new Set(["node_modules", ".next", "dist", "build", ".expo", ".turbo", ".pnpm", ".magnus_backups"]);

const packages = new Map(); // name -> deps[]

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (full.split(path.sep).some((p) => IGNORE.has(p))) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (entry === "package.json") {
      const data = JSON.parse(fs.readFileSync(full, "utf8"));
      const deps = Object.assign({}, data.dependencies, data.devDependencies, data.peerDependencies, data.optionalDependencies);
      const internalDeps = Object.keys(deps || {}).filter((d) => d.startsWith(SCOPE));
      packages.set(data.name || full, internalDeps);
    }
  }
};
walk(ROOT);

const visited = new Set();
const stack = new Set();
const cycles = [];

const dfs = (node, pathStack) => {
  if (stack.has(node)) {
    const cycleStart = pathStack.indexOf(node);
    cycles.push(pathStack.slice(cycleStart).concat(node));
    return;
  }
  if (visited.has(node)) return;
  visited.add(node);
  stack.add(node);
  const deps = packages.get(node) || [];
  for (const dep of deps) {
    if (packages.has(dep)) dfs(dep, pathStack.concat(dep));
  }
  stack.delete(node);
};

for (const node of packages.keys()) {
  dfs(node, [node]);
}

assert.strictEqual(cycles.length, 0, `Circular dependencies detected:\n${cycles.map((c) => c.join(" -> ")).join("\n")}`);
console.log("✅ test-circular-dependencies passed");
