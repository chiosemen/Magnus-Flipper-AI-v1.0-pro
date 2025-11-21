#!/usr/bin/env node
/**
 * Fortify turbo.json to use "tasks" schema and scoped filters.
 */
const fs = require("fs");
const path = require("path");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const turboPath = path.join(ROOT, "turbo.json");
const SCOPE = "@magnus-flipper-ai/";

if (!fs.existsSync(turboPath)) {
  console.error("❌ turbo.json not found");
  process.exit(1);
}

const desired = {
  $schema: "https://turbo.build/schema.json",
  tasks: {
    build: {
      dependsOn: ["^build"],
      inputs: ["packages/**", "apps/**"],
      outputs: ["dist/**"],
    },
    dev: { cache: false },
    test: { cache: false },
    lint: { cache: false },
  },
};

fs.writeFileSync(turboPath, JSON.stringify(desired, null, 2) + "\n", "utf8");
console.log("✅ turbo.json fortified to tasks schema.");
