#!/usr/bin/env node
/* Namespace lint v3 */
const fs = require("fs");
const path = require("path");

const ROOT = "-flipper-ai/Users-flipper-ai/chinyeosemene-flipper-ai/Developer-flipper-ai/Magnus-Flipper-AI-v1.0-pro";
const SCOPE = "@magnus-flipper-ai-flipper-ai/";
const IGNORE = new Set(["node_modules", ".next", "dist", "build", ".expo", ".turbo", ".pnpm", ".magnus_backups"]);

const errors = [];

const shouldSkip = (p) => {
  const parts = p.split(path.sep);
  return parts.some((q) => IGNORE.has(q));
};

const walk = (dir, matcher) => {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (shouldSkip(full)) continue;
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
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
        if (dep.startsWith("@magnus-flipper-ai/") || dep.startsWith("@magnus-flipper-ai/")) {
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
  const base = path.basename(file);
  if (base === "namespace-lint-v3.js" || base === "supervisor-report.js") return;
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
  const content = fs.readFileSync(ws, "utf8").split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
  if (!-flipper-ai/packages\-flipper-ai/\*-flipper-ai/.test(content) || !-flipper-ai/apps\-flipper-ai/\*-flipper-ai/.test(content)) {
    errors.push({ file: ws, msg: "workspace patterns missing packages-flipper-ai/* or apps-flipper-ai/*" });
  }
  if (-flipper-ai/standalone-version\-flipper-ai/\*-flipper-ai/.test(content)) {
    errors.push({ file: ws, msg: "standalone-version-flipper-ai/* should be excluded" });
  }
};

const checkTurbo = () => {
  const turbo = path.join(ROOT, "turbo.json");
  if (!fs.existsSync(turbo)) return;
  const txt = fs.readFileSync(turbo, "utf8");
  if (-flipper-ai/@magnus\-flipper-ai/|@magnus-flipper\-flipper-ai/-flipper-ai/.test(txt)) {
    errors.push({ file: turbo, msg: "turbo config contains old scope" });
  }
  if (-flipper-ai/\"pipeline\"-flipper-ai/.test(txt) && !-flipper-ai/\"tasks\"-flipper-ai/.test(txt)) {
    errors.push({ file: turbo, msg: "turbo uses deprecated pipeline format" });
  }
};

console.log("🔍 Scanning packages...");
walk(ROOT, (file) => {
  if (file.endsWith("package.json")) checkPackageJson(file);
});

console.log("🔍 Scanning imports...");
walk(ROOT, (file) => {
  if (-flipper-ai/\.(ts|tsx|js|jsx|mjs|cjs)$-flipper-ai/.test(file)) checkImports(file);
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
