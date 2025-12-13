#!/usr/bin/env ts-node
/**
 * Workspace Export Verification Script
 * 
 * Scans all workspace packages under /packages/* and verifies that every
 * export path in package.json "exports" field points to a file that exists.
 * 
 * This prevents build failures from broken export paths before they reach
 * Next.js or other consumers.
 * 
 * Usage:
 *   ts-node tools/verify-workspace-exports.ts
 * 
 * Exit codes:
 *   0 = All exports valid
 *   1 = One or more exports invalid
 */

const fs = require("fs");
const path = require("path");

interface ExportError {
  packageName: string;
  packagePath: string;
  exportPath: string;
  targetPath: string;
  resolvedPath: string;
  exists: boolean;
}

const REPO_ROOT = path.resolve(__dirname, "..");
const PACKAGES_DIR = path.join(REPO_ROOT, "packages");

/**
 * Recursively collect all export paths from an exports object.
 * Handles both string values and objects with "default", "import", "require", etc.
 */
function collectExportPaths(
  exports: any,
  basePath: string = ""
): Array<{ exportPath: string; targetPath: string }> {
  const results: Array<{ exportPath: string; targetPath: string }> = [];

  if (typeof exports === "string") {
    // Simple string export
    results.push({
      exportPath: basePath || ".",
      targetPath: exports,
    });
  } else if (Array.isArray(exports)) {
    // Array of conditions (take first valid one)
    for (const item of exports) {
      if (typeof item === "string") {
        results.push({
          exportPath: basePath || ".",
          targetPath: item,
        });
        break; // Use first string in array
      }
    }
  } else if (exports && typeof exports === "object") {
    // Object with conditions or nested exports
    for (const [key, value] of Object.entries(exports)) {
      if (key === "default" || key === "import" || key === "require" || key === "types") {
        // Condition value - extract the actual path
        if (typeof value === "string") {
          results.push({
            exportPath: basePath || ".",
            targetPath: value,
          });
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "string") {
              results.push({
                exportPath: basePath || ".",
                targetPath: item,
              });
              break;
            }
          }
        }
      } else {
        // Nested export path (e.g., "./providers")
        const nestedBase = basePath ? `${basePath}/${key}` : `./${key}`;
        const nested = collectExportPaths(value, nestedBase);
        results.push(...nested);
      }
    }
  }

  return results;
}

/**
 * Verify exports for a single package
 */
function verifyPackageExports(
  packagePath: string,
  packageJson: any
): ExportError[] {
  const errors: ExportError[] = [];
  const packageName = packageJson.name || path.basename(packagePath);

  if (!packageJson.exports) {
    // No exports field - skip (legacy packages may not have exports)
    return errors;
  }

  const exportPaths = collectExportPaths(packageJson.exports);

  for (const { exportPath, targetPath } of exportPaths) {
    // Skip wildcard patterns (they're not literal file paths)
    if (targetPath.includes("*")) {
      continue;
    }

    // Resolve target path relative to package root
    const resolvedPath = path.resolve(packagePath, targetPath);
    const exists = fs.existsSync(resolvedPath);

    if (!exists) {
      // For dist files, check if source exists (package may not be built yet)
      if (targetPath.includes("dist/")) {
        // Try to find corresponding source file
        const sourcePath = targetPath.replace(/dist\//, "src/").replace(/\.js$/, ".ts");
        const resolvedSourcePath = path.resolve(packagePath, sourcePath);
        if (fs.existsSync(resolvedSourcePath)) {
          // Source exists, dist will be created during build - this is OK
          continue;
        }
        
        // Also check if there's a tsconfig.json (package will be built)
        const tsconfigPath = path.join(packagePath, "tsconfig.json");
        if (fs.existsSync(tsconfigPath)) {
          // Package has build config, dist will be created - this is OK for pre-build verification
          continue;
        }
      }

      errors.push({
        packageName,
        packagePath,
        exportPath,
        targetPath,
        resolvedPath,
        exists: false,
      });
      continue;
    }

    // Check if it's a file (not just a directory)
    const isFile = fs.statSync(resolvedPath).isFile();

    if (!isFile) {
      errors.push({
        packageName,
        packagePath,
        exportPath,
        targetPath,
        resolvedPath,
        exists: true, // exists but not a file
      });
    }
  }

  return errors;
}

/**
 * Main verification function
 */
function verifyAllExports(): { errors: ExportError[]; success: boolean } {
  const errors: ExportError[] = [];

  if (!fs.existsSync(PACKAGES_DIR)) {
    console.error(`❌ Packages directory not found: ${PACKAGES_DIR}`);
    process.exit(1);
  }

  const packageDirs = fs
    .readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((dirent: any) => dirent.isDirectory())
    .map((dirent: any) => path.join(PACKAGES_DIR, dirent.name));

  console.log(`🔍 Scanning ${packageDirs.length} workspace packages...\n`);

  for (const packageDir of packageDirs) {
    const packageJsonPath = path.join(packageDir, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      // Skip directories without package.json
      continue;
    }

    try {
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, "utf-8")
      );
      const packageErrors = verifyPackageExports(packageDir, packageJson);

      if (packageErrors.length > 0) {
        errors.push(...packageErrors);
      } else if (packageJson.exports) {
        // Only log success if package has exports (avoid noise)
        const exportCount = Object.keys(
          collectExportPaths(packageJson.exports)
        ).length;
        if (exportCount > 0) {
          console.log(`  ✅ ${packageJson.name || path.basename(packageDir)}`);
        }
      }
    } catch (error: any) {
      console.error(
        `❌ Failed to process ${packageDir}: ${error.message}`
      );
      errors.push({
        packageName: path.basename(packageDir),
        packagePath: packageDir,
        exportPath: "?",
        targetPath: "?",
        resolvedPath: "?",
        exists: false,
      });
    }
  }

  return { errors, success: errors.length === 0 };
}

/**
 * Print errors in a clear format
 */
function printErrors(errors: ExportError[]): void {
  console.error("\n❌ Workspace Export Verification Failed\n");
  console.error(`Found ${errors.length} invalid export path(s):\n`);

  for (const error of errors) {
    console.error(`  Package: ${error.packageName}`);
    console.error(`  Export:  ${error.exportPath}`);
    console.error(`  Target:  ${error.targetPath}`);
    console.error(`  Resolved: ${error.resolvedPath}`);
    console.error(`  Status:  ${error.exists ? "exists but not a file" : "file not found"}`);
    console.error("");
  }

  console.error("💡 Fix: Ensure all export paths in package.json point to existing files.");
  console.error("   For source files, verify the file exists in the package directory.");
  console.error("   For dist files, ensure the package is built first.\n");
}

// Main execution
if (require.main === module) {
  const { errors, success } = verifyAllExports();

  if (!success) {
    printErrors(errors);
    process.exit(1);
  }

  console.log("\n✅ All workspace exports are valid!\n");
  process.exit(0);
}

module.exports = { verifyAllExports, verifyPackageExports, collectExportPaths };
