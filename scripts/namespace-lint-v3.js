#!/usr/bin/env node
/* Namespace lint v3 */
const fs = require("fs");
const path = require("path");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const SCOPE = "@magnus-flipper-ai/";
const IGNORE = new Set(["node_modules", ".next", "dist", "build", ".expo", ".turbo", ".pnpm", ".magnus_backups"]);

const errors = [];

const shouldSkip = (p) => {
  const parts = p.split(path.sep);
  return parts.some((q) => IGNORE.has(q));
};

const walk = (dir, matcher) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (shouldSkip(full)) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, matcher);
    else matcher(full);
  }
};

const checkPackageJson = (file) => {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data.name?.startsWith(SCOPE)) {
      errors.push({ file, msg: `package name not scoped: ${data.name}` });
    }
    const checkDeps = (deps = {}, section = "dependencies") => {
      for (const dep of Object.keys(deps)) {
        if (dep.startsWith("@magnus/") || dep.startsWith("@magnus-flipper/")) {
          errors.push({ file, msg: `${section} uses old scope: ${dep}` });
        }
      }
    };
    checkDeps(data.dependencies, "dependencies");
    checkDeps(data.devDependencies, "devDependencies");
    checkDeps(data.peerDependencies, "peerDependencies");
    checkDeps(data.optionalDependencies, "optionalDependencies");
  } catch (err) {
    errors.push({ file, msg: `invalid package.json: ${err.message}` });
  }
};

const checkImports = (file) => {
  const text = fs.readFileSync(file, "utf8");
  if (/@magnus\/|@magnus-flipper\//.test(text)) {
    errors.push({ file, msg: "old scope import detected" });
  }
};

const checkWorkspace = () => {
  const ws = path.join(ROOT, "pnpm-workspace.yaml");
  if (!fs.existsSync(ws)) {
    errors.push({ file: ws, msg: "pnpm-workspace.yaml missing" });
    return;
  }
  const content = fs.readFileSync(ws, "utf8");
  if (!/packages\/\*/.test(content) || !/apps\/\*/.test(content)) {
    errors.push({ file: ws, msg: "workspace patterns missing packages/* or apps/*" });
  }
  if (/standalone-version\/\*/.test(content)) {
    errors.push({ file: ws, msg: "standalone-version/* should be excluded" });
  }
};

const checkTurbo = () => {
  const turbo = path.join(ROOT, "turbo.json");
  if (!fs.existsSync(turbo)) return;
  const txt = fs.readFileSync(turbo, "utf8");
  if (/@magnus\/|@magnus-flipper\//.test(txt)) {
    errors.push({ file: turbo, msg: "turbo config contains old scope" });
  }
  if (/\"pipeline\"/.test(txt) && !/\"tasks\"/.test(txt)) {
    errors.push({ file: turbo, msg: "turbo uses deprecated pipeline format" });
  }
};

console.log("🔍 Scanning packages...");
walk(ROOT, (file) => {
  if (file.endsWith("package.json")) checkPackageJson(file);
});

console.log("🔍 Scanning imports...");
walk(ROOT, (file) => {
  if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)) checkImports(file);
});

checkWorkspace();
checkTurbo();

if (errors.length) {
  console.log("❌ Namespace lint FAILED");
  for (const e of errors) {
    console.log(` - ${e.file}: ${e.msg}`);
  }
  process.exit(1);
} else {
  console.log("✅ Namespace lint PASS");
}
