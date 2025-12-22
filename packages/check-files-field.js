const fs = require("fs");
const path = require("path");

const packagesDir = process.cwd();
const packages = fs.readdirSync(packagesDir).filter(d => {
  try {
    return fs.statSync(path.join(packagesDir, d)).isDirectory();
  } catch { return false; }
});

console.log("=== PACKAGES MISSING 'files' FIELD ===\n");
packages.forEach(pkg => {
  const pkgJsonPath = path.join(packagesDir, pkg, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    const data = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    if (!data.files) {
      console.log(`✗ ${pkg}`);
    }
  }
});
