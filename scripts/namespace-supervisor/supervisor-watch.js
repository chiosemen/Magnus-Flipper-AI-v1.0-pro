#!/usr/bin/env node
/**
 * Lightweight watcher to alert on namespace regressions.
 */
const fs = require("fs");
const path = require("path");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const SCOPE = "@magnus-flipper-ai/";
const IGNORE = new Set(["node_modules", ".next", "dist", "build", ".expo", ".turbo", ".pnpm", ".magnus_backups"]);

const shouldSkip = (p) => p.split(path.sep).some((q) => IGNORE.has(q));

const scanFile = (file) => {
  if (!/\.(ts|tsx|js|jsx|mjs|cjs|json)$/.test(file)) return;
  if (shouldSkip(file)) return;
  try {
    const text = fs.readFileSync(file, "utf8");
    if (/@magnus\/|@magnus-flipper\//.test(text)) {
      console.warn(`⚠️  Old scope detected: ${path.relative(ROOT, file)}`);
    }
  } catch (_) {
    /* ignore */
  }
};

const watchDir = (dir) => {
  if (shouldSkip(dir)) return;
  fs.watch(dir, { recursive: true }, (event, filename) => {
    if (!filename) return;
    const full = path.join(dir, filename);
    scanFile(full);
  });
};

console.log("👀 Namespace supervisor watch started...");
watchDir(ROOT);
