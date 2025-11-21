#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const ws = path.join(ROOT, "pnpm-workspace.yaml");

assert.ok(fs.existsSync(ws), "pnpm-workspace.yaml missing");
const txt = fs.readFileSync(ws, "utf8");
assert.ok(/packages\/\*/.test(txt), "packages/* missing from workspace");
assert.ok(/apps\/\*/.test(txt), "apps/* missing from workspace");
assert.ok(!/standalone-version\/\*/.test(txt), "standalone-version/* should be excluded");

console.log("✅ test-workspace-visibility passed");
