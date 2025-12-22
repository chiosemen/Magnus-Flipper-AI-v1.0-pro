const fs = require("fs");
const path = require("path");

const packagesDir = process.cwd();
const packages = fs.readdirSync(packagesDir).filter(d => {
  try {
    return fs.statSync(path.join(packagesDir, d)).isDirectory();
  } catch { return false; }
});

console.log("=== PACKAGES WITH dist/ ===");
packages.forEach(pkg => {
  const distPath = path.join(packagesDir, pkg, "dist");
  if (fs.existsSync(distPath)) {
    const hasIndexJs = fs.existsSync(path.join(distPath, "index.js"));
    const hasIndexDts = fs.existsSync(path.join(distPath, "index.d.ts"));
    console.log(`✓ ${pkg}: index.js=${hasIndexJs}, index.d.ts=${hasIndexDts}`);
  }
});

console.log("\n=== PACKAGES WITHOUT dist/ ===");
packages.forEach(pkg => {
  const distPath = path.join(packagesDir, pkg, "dist");
  if (!fs.existsSync(distPath)) {
    const pkgJsonPath = path.join(packagesDir, pkg, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
      const data = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      console.log(`✗ ${pkg}: main=${data.main}, buildScript=${data.scripts?.build || "NONE"}`);
    }
  }
});
