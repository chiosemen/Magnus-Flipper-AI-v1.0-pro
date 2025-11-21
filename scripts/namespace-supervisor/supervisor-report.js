#!/usr/bin/env node
/**
 * Supervisor report: generates SUPERVISOR_REPORT.md with namespace findings.
 */
const fs = require("fs");
const path = require("path");

const ROOT = "/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro";
const REPORT = path.join(ROOT, "SUPERVISOR_REPORT.md");
const SCOPE = "@magnus-flipper-ai/";
const IGNORE = new Set(["node_modules", ".next", "dist", "build", ".expo", ".turbo", ".pnpm", ".magnus_backups"]);

const errs = [];

const skip = (p) => p.split(path.sep).some((p) => IGNORE.has(p));

const walk = (dir, cb) => {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (skip(full)) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, cb);
    else cb(full);
  }
};

const checkPkg = (file) => {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data.name?.startsWith(SCOPE)) errs.push({ type: "package-name", file, msg: `name=${data.name}` });
    const scanDeps = (deps = {}, section) => {
      for (const dep of Object.keys(deps)) {
        if (dep.startsWith("@magnus/") || dep.startsWith("@magnus-flipper/")) {
          errs.push({ type: "dependency-scope", file, msg: `${section}: ${dep}` });
        }
      }
    };
    scanDeps(data.dependencies, "dependencies");
    scanDeps(data.devDependencies, "devDependencies");
    scanDeps(data.peerDependencies, "peerDependencies");
    scanDeps(data.optionalDependencies, "optionalDependencies");
  } catch (e) {
    errs.push({ type: "package-json", file, msg: e.message });
  }
};

const checkImports = (file) => {
  const txt = fs.readFileSync(file, "utf8");
  if (/@magnus\/|@magnus-flipper\//.test(txt)) {
    errs.push({ type: "import-scope", file, msg: "contains old scope" });
  }
};

const checkWorkspace = () => {
  const ws = path.join(ROOT, "pnpm-workspace.yaml");
  if (!fs.existsSync(ws)) {
    errs.push({ type: "workspace", file: ws, msg: "missing" });
    return;
  }
  const txt = fs.readFileSync(ws, "utf8");
  if (!/packages\/\*/.test(txt) || !/apps\/\*/.test(txt)) {
    errs.push({ type: "workspace", file: ws, msg: "packages/* or apps/* missing" });
  }
  if (/standalone-version\/\*/.test(txt)) {
    errs.push({ type: "workspace", file: ws, msg: "standalone-version/* should be excluded" });
  }
};

const checkTurbo = () => {
  const file = path.join(ROOT, "turbo.json");
  if (!fs.existsSync(file)) return;
  const txt = fs.readFileSync(file, "utf8");
  if (/@magnus\/|@magnus-flipper\//.test(txt)) {
    errs.push({ type: "turbo", file, msg: "contains old scope" });
  }
  if (!/\"tasks\"/.test(txt)) {
    errs.push({ type: "turbo", file, msg: "missing tasks schema" });
  }
};

walk(ROOT, (f) => {
  if (f.endsWith("package.json")) checkPkg(f);
});

walk(ROOT, (f) => {
  if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f)) checkImports(f);
});

checkWorkspace();
checkTurbo();

const lines = [];
lines.push("# Namespace Supervisor Report");
lines.push("");
lines.push(`Scope: \`${SCOPE}\``);
lines.push("");
if (errs.length === 0) {
  lines.push("✅ No issues detected.");
} else {
  lines.push(`❌ Found ${errs.length} issues:`);
  lines.push("");
  for (const e of errs) {
    const rel = path.relative(ROOT, e.file);
    lines.push(`- **${e.type}**: \`${rel}\` — ${e.msg}`);
  }
}
lines.push("");
fs.writeFileSync(REPORT, lines.join("\n"), "utf8");
console.log(`Report written to ${REPORT}`);
if (errs.length) process.exit(1);
