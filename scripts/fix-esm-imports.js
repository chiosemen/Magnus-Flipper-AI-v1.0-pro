#!/usr/bin/env node
/**
 * Auto-fix ESM imports: Add .js extensions to relative imports
 * Scans packages/* and apps/worker-* for TypeScript files
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");

const filesChanged = [];
const importsFixed = [];

function shouldFixImport(path) {
  // Only fix relative imports (./ or ../)
  if (!path.startsWith("./") && !path.startsWith("../")) {
    return false;
  }
  
  // Don't fix if already has .js, .ts, or .json extension
  if (path.endsWith(".js") || path.endsWith(".ts") || path.endsWith(".json")) {
    return false;
  }
  
  // Don't fix if it's a directory import (ends with /)
  if (path.endsWith("/")) {
    return false;
  }
  
  return true;
}

function fixImportsInFile(filePath) {
  let content = readFileSync(filePath, "utf8");
  let modified = false;
  let fileImportsFixed = 0;
  
  // Match: from "path" or from 'path'
  // Also match: import("path") for dynamic imports
  const importPatterns = [
    // Static imports: from "..." or from '...'
    /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
    // Dynamic imports: import("...")
    /(import\s*\(\s*['"])(\.\.?\/[^'"]+)(['"]\s*\))/g,
    // Export from: export ... from "..."
    /(export\s+.*\s+from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
  ];
  
  for (const pattern of importPatterns) {
    content = content.replace(pattern, (match, prefix, path, suffix) => {
      if (shouldFixImport(path)) {
        modified = true;
        fileImportsFixed++;
        return `${prefix}${path}.js${suffix}`;
      }
      return match;
    });
  }
  
  if (modified) {
    writeFileSync(filePath, content, "utf8");
    filesChanged.push(filePath);
    importsFixed.push({ file: filePath, count: fileImportsFixed });
  }
  
  return fileImportsFixed;
}

function walkDirectory(dir, baseDir = repoRoot) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, .git, etc.
      if (entry === "node_modules" || entry === "dist" || entry === ".git" || entry.startsWith(".")) {
        continue;
      }
      walkDirectory(fullPath, baseDir);
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      fixImportsInFile(fullPath);
    }
  }
}

// Scan packages/*
const packagesDir = join(repoRoot, "packages");
if (statSync(packagesDir).isDirectory()) {
  console.log("📦 Scanning packages/*...");
  walkDirectory(packagesDir);
}

// Scan apps/worker-*
const appsDir = join(repoRoot, "apps");
if (statSync(appsDir).isDirectory()) {
  const workerDirs = readdirSync(appsDir)
    .filter(entry => entry.startsWith("worker-"))
    .map(entry => join(appsDir, entry));
  
  for (const workerDir of workerDirs) {
    if (statSync(workerDir).isDirectory()) {
      console.log(`📦 Scanning ${workerDir}...`);
      walkDirectory(workerDir);
    }
  }
}

// Print summary
console.log("\n" + "=".repeat(60));
console.log("✅ IMPORT FIX SUMMARY");
console.log("=".repeat(60));
console.log(`\n📝 Files Changed: ${filesChanged.length}`);
console.log(`🔧 Total Imports Fixed: ${importsFixed.reduce((sum, item) => sum + item.count, 0)}`);

if (filesChanged.length > 0) {
  console.log("\n📋 Changed Files:");
  filesChanged.forEach(file => {
    const relativePath = file.replace(repoRoot + "/", "");
    const count = importsFixed.find(item => item.file === file)?.count || 0;
    console.log(`   ${relativePath} (${count} imports)`);
  });
}

console.log("\n" + "=".repeat(60));

