#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f)) {
      let txt = readFileSync(p, "utf8");
      txt = txt.replace(
        /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
        (m, pre, path, post) => {
          if (path.endsWith(".js") || path.endsWith(".json")) return m;
          return `${pre}${path}.js${post}`;
        }
      );
      writeFileSync(p, txt);
    }
  }
}
walk("src");
console.log("✅ Added .js extensions to relative imports");
