#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "apps/web/src");

function walk(dir, files = []) {
  fs.readdirSync(dir).forEach((f) => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) files.push(full);
  });
  return files;
}

let errors = [];

function checkImports(file) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    if (line.includes("@magnus-flipper-ai/ui") &&
        !fs.existsSync("packages/ui")) {
      errors.push(`${file}:${i+1} → UI package missing`);
    }

    if (line.includes("@magnus-flipper-ai/ui-config") &&
        !fs.existsSync("packages/ui-config")) {
      errors.push(`${file}:${i+1} → UI-Config package missing`);
    }
  });
}

walk(ROOT).forEach(checkImports);

if (errors.length) {
  console.error("❌ IMPORT VALIDATION FAILED:");
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
} else {
  console.log("✅ All imports valid");
}

