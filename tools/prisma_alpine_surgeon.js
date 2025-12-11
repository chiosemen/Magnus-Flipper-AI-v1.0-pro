#!/usr/bin/env node

/**
 * Prisma Alpine Surgeon v2.0
 * -------------------------------------------
 * Detects Prisma 7.1.x Alpine failures, recommends fixes,
 * and applies required patches to make Prisma run inside Node 20 Alpine Docker builds.
 *
 * Features:
 *  - Prisma version detection
 *  - Engine failure detection
 *  - Auto-recommendation messages
 *  - Auto-pinning to 7.0.1
 *  - Dockerfile patching
 *  - Schema binaryTargets updates
 */

const fs = require("fs");
const path = require("path");

//
// 1. Prisma Version Detection
//

function detectPrismaVersion() {
  try {
    const pkgPath = path.resolve("packages/core/package.json");
    if (!fs.existsSync(pkgPath)) {
      return null;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const version = pkg.devDependencies?.prisma || 
                    pkg.dependencies?.prisma ||
                    pkg.dependencies?.["@prisma/client"];
    return version ? version.replace(/[\^~]/, "").trim() : null;
  } catch (err) {
    console.error("Error detecting Prisma version:", err.message);
    return null;
  }
}

//
// 2. Alpine Engine Failure Detection
//

function detectEngineFailure(log) {
  if (!log || typeof log !== "string") return false;
  return log.includes("Could not convert engine type queryEngine") ||
         log.includes("Error: Could not convert engine type") ||
         log.includes("Could not convert engine type");
}

//
// 3. Auto-Recommendation Message
//

function prismaFixRecommendation(version) {
  if (!version) {
    return "⚠️  Could not detect Prisma version.";
  }

  if (version.startsWith("7.1")) {
    return `
🚨 Prisma 7.1.x detected on Alpine Linux — this version is KNOWN BROKEN.

Error signature: "Could not convert engine type queryEngine"

Fix options:
  A) Pin Prisma to 7.0.1 (recommended, stable)
  B) Switch Dockerfile base image to Debian (fallback)
  C) Wait for Prisma patch release

Use command:
  Run "ApplyPrismaPin701" in Cursor
`;
  }

  if (version.startsWith("7.0")) {
    return `
⚠️  Prisma 7.0.x detected. If you're seeing engine errors, try:
  - Ensure binaryTargets includes "linux-musl" in schema.prisma
  - Check that PRISMA_CLI_QUERY_ENGINE_TYPE=binary is set in Dockerfile
`;
  }

  return `Prisma version ${version} detected. Version does not match the 7.1 Alpine failure pattern.`;
}

//
// 4. Auto-Pinning Mode
//

function applyPrisma701Pin() {
  const paths = [
    "package.json",
    "packages/core/package.json",
    "packages/rate-limiter/package.json",
    "packages/marketplace-config/package.json"
  ];

  let pinned = 0;

  for (const file of paths) {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
      let changed = false;

      // Update dependencies
      if (pkg.dependencies) {
        if (pkg.dependencies.prisma && pkg.dependencies.prisma !== "7.0.1") {
          pkg.dependencies.prisma = "7.0.1";
          changed = true;
        }
        if (pkg.dependencies["@prisma/client"] && pkg.dependencies["@prisma/client"] !== "7.0.1") {
          pkg.dependencies["@prisma/client"] = "7.0.1";
          changed = true;
        }
        if (pkg.dependencies["@prisma/adapter-pg"] && pkg.dependencies["@prisma/adapter-pg"] !== "7.0.1") {
          pkg.dependencies["@prisma/adapter-pg"] = "7.0.1";
          changed = true;
        }
      }

      // Update devDependencies
      if (pkg.devDependencies) {
        if (pkg.devDependencies.prisma && pkg.devDependencies.prisma !== "7.0.1") {
          pkg.devDependencies.prisma = "7.0.1";
          changed = true;
        }
        if (pkg.devDependencies["@prisma/client"] && pkg.devDependencies["@prisma/client"] !== "7.0.1") {
          pkg.devDependencies["@prisma/client"] = "7.0.1";
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2));
        console.log(`✨ Pinned Prisma to 7.0.1 in ${file}`);
        pinned++;
      }
    } catch (err) {
      console.error(`❌ Error updating ${file}:`, err.message);
    }
  }

  return pinned > 0 
    ? `🔧 Prisma has been pinned to 7.0.1 across ${pinned} package.json file(s).`
    : `✓ All Prisma dependencies are already pinned to 7.0.1.`;
}

//
// 5. Dockerfile Patching (existing logic)
//

const dockerPatch = `
# -------------------------------------------------------
# Prisma fix for Alpine Linux (musl vs glibc)
# -------------------------------------------------------
RUN apk add --no-cache curl bash libc6-compat
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
ENV PRISMA_MIGRATION_ENGINE_BINARY_TARGETS=linux-musl
# -------------------------------------------------------
`;

function patchDockerfile(dockerfilePath) {
  const p = path.resolve(dockerfilePath);
  if (!fs.existsSync(p)) {
    console.log(`❌ Dockerfile not found: ${dockerfilePath}`);
    return;
  }
  let data = fs.readFileSync(p, "utf8");
  if (data.includes("PRISMA_CLI_QUERY_ENGINE_TYPE")) {
    console.log(`✓ Dockerfile already patched: ${dockerfilePath}`);
    return;
  }
  // Insert after WORKDIR /app
  const updated = data.replace(
    "WORKDIR /app",
    `WORKDIR /app\n${dockerPatch}`
  );
  fs.writeFileSync(p, updated);
  console.log(`✨ Patched Dockerfile: ${dockerfilePath}`);

  // Fix frozen lockfile issue and skip scripts to avoid postinstall failures
  let updated2 = fs.readFileSync(p, "utf8");
  if (!updated2.includes("--ignore-scripts")) {
    updated2 = updated2.replace(
      /RUN pnpm install --no-frozen-lockfile/g,
      "RUN pnpm install --no-frozen-lockfile --ignore-scripts"
    );
    // Add explicit prisma generate before build
    if (!updated2.includes("prisma generate --schema")) {
      updated2 = updated2.replace(
        /(# Install all dependencies.*?\nRUN pnpm install[^\n]+\n)\n(# Build packages)/,
        `$1\n# Generate Prisma client explicitly\nRUN pnpm --filter @magnus-flipper-ai/core exec -- prisma generate --schema=./prisma/schema.prisma\n\n$2`
      );
    }
    fs.writeFileSync(p, updated2);
    console.log(`✨ Updated pnpm install flags and added explicit prisma generate: ${dockerfilePath}`);
  } else {
    console.log(`✓ Dockerfile already has --ignore-scripts: ${dockerfilePath}`);
  }
}

//
// 6. Schema Patching
//

function patchPrismaSchema() {
  const schemaPath = "packages/core/prisma/schema.prisma";
  if (!fs.existsSync(schemaPath)) {
    console.log("❌ Prisma schema not found at packages/core/prisma/schema.prisma");
    return;
  }

  const schema = fs.readFileSync(schemaPath, "utf8");
  
  // Check if binaryTargets already exists
  if (schema.includes("binaryTargets")) {
    console.log("✓ Prisma schema already includes binaryTargets");
    
    // Ensure linux-musl is included
    if (!schema.includes("linux-musl")) {
      const updated = schema.replace(
        /binaryTargets\s*=\s*\[([^\]]+)\]/,
        (match, targets) => {
          const targetsList = targets.split(",").map(t => t.trim().replace(/"/g, ""));
          if (!targetsList.includes("linux-musl")) {
            targetsList.push("linux-musl");
          }
          return `binaryTargets = [${targetsList.map(t => `"${t}"`).join(", ")}]`;
        }
      );
      fs.writeFileSync(schemaPath, updated);
      console.log("✨ Added linux-musl to binaryTargets");
    }
  } else {
    console.log("✨ Adding binaryTargets to Prisma schema...");
    if (schema.includes("generator client")) {
      const updated = schema.replace(
        /(generator client\s*\{[^}]*)(\})/,
        `$1\n  binaryTargets = ["native", "linux-musl"]\n$2`
      );
      fs.writeFileSync(schemaPath, updated);
    }
  }
}

//
// 7. Main Execution Block (Module Export)
//

async function prismaAlpineSurgeon(logOutput = "") {
  const prismaVersion = detectPrismaVersion();
  const engineFailure = detectEngineFailure(logOutput);

  if (engineFailure) {
    console.log("❌ Prisma engine failure detected in Docker build");
    console.log("Prisma version:", prismaVersion || "unknown");

    const reco = prismaFixRecommendation(prismaVersion);
    console.log(reco);

    return {
      status: "error",
      prismaVersion,
      engineFailure: true,
      recommendation: reco
    };
  }

  return { status: "ok", prismaVersion };
}

//
// 8. CLI Execution (if run directly)
//

if (require.main === module) {
  console.log("==============================================");
  console.log("  Prisma Alpine Surgeon v2.0");
  console.log("==============================================\n");

  // Detect version
  const version = detectPrismaVersion();
  console.log(`📦 Detected Prisma version: ${version || "unknown"}\n`);

  // Patch Dockerfiles
  console.log("🔧 Patching Dockerfiles...");
  patchDockerfile("apps/worker-realtime/Dockerfile");
  patchDockerfile("apps/worker-scheduler/Dockerfile");

  // Patch schema
  console.log("\n🔧 Patching Prisma schema...");
  patchPrismaSchema();

  // Patch package.json
  console.log("\n🔧 Checking package.json files...");
  const pinResult = applyPrisma701Pin();
  console.log(pinResult);

  console.log("\n🩺 Prisma Alpine Surgeon Complete.\n");
}

// Export for use as module
module.exports = {
  prismaAlpineSurgeon,
  detectPrismaVersion,
  detectEngineFailure,
  prismaFixRecommendation,
  applyPrisma701Pin,
  patchDockerfile,
  patchPrismaSchema
};
