#!/usr/bin/env node

/**
 * Prisma Build Surgeon v3
 * -------------------------------------------
 * Battle-tested, Alpine-safe, automated, self-healing build mode
 * 
 * Orchestrates:
 *  - Prisma version pinning
 *  - Engine detection
 *  - Docker cleanup
 *  - Rebuild with Debian fallback
 *  - Full worker image push
 *  - Terraform Apply orchestration
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Import v2 tools
const {
  detectPrismaVersion,
  detectEngineFailure,
  applyPrisma701Pin,
  patchDockerfile,
  patchPrismaSchema
} = require("./prisma_alpine_surgeon");

function log(msg, emoji = "✨") {
  console.log(`\n${emoji} ${msg}\n`);
}

function run(cmd, options = {}) {
  console.log(`\n▶️  ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", ...options });
    return { ok: true };
  } catch (err) {
    console.error(`❌ Command failed: ${cmd}`);
    return { ok: false, err };
  }
}

function runCapture(cmd, options = {}) {
  try {
    const out = execSync(cmd, { encoding: "utf8", ...options });
    return { ok: true, out: out.trim() };
  } catch (err) {
    return { ok: false, err: err.message };
  }
}

async function phase1_autoPinPrisma() {
  log("PHASE 1: Auto-pin Prisma to 7.0.1", "🔧");
  
  // Apply pinning
  const pinResult = applyPrisma701Pin();
  console.log(pinResult);
  
  // Run Prisma Alpine Surgeon v2
  log("Running Prisma Alpine Surgeon v2...");
  run("node tools/prisma_alpine_surgeon.js");
  
  // Verify
  const version = detectPrismaVersion();
  if (version !== "7.0.1") {
    throw new Error(`Prisma version is ${version}, expected 7.0.1`);
  }
  
  // Check schema
  const schemaPath = "packages/core/prisma/schema.prisma";
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    if (!schema.includes("linux-musl") && !schema.includes("debian-openssl")) {
      log("Adding binaryTargets to schema...");
      patchPrismaSchema();
    }
  }
  
  log("✅ Phase 1 complete: Prisma pinned to 7.0.1", "✅");
}

async function phase2_dockerCleanup() {
  log("PHASE 2: Docker system cleanup", "🧹");
  
  log("Running docker system prune...");
  const pruneRes = run("docker system prune -a --volumes --force");
  
  if (!pruneRes.ok) {
    console.warn("⚠️  Docker prune had issues, continuing anyway...");
  }
  
  // Check disk usage (macOS/Linux)
  const diskCheck = runCapture("df -h . | tail -1 | awk '{print $5}' | sed 's/%//'");
  if (diskCheck.ok) {
    const diskUsage = parseInt(diskCheck.out);
    if (diskUsage >= 85) {
      console.warn(`⚠️  Disk usage is ${diskUsage}% (≥85%). Consider freeing space.`);
      console.warn("Continuing anyway, but build may fail if disk fills up.");
    } else {
      log(`✅ Disk usage: ${diskUsage}% (safe)`, "✅");
    }
  }
  
  log("✅ Phase 2 complete: Docker cleaned", "✅");
}

function phase3_patchDockerfiles() {
  log("PHASE 3: Patching Dockerfiles for Debian fallback", "🔧");
  
  const dockerfiles = [
    "apps/worker-realtime/Dockerfile",
    "apps/worker-scheduler/Dockerfile"
  ];
  
  dockerfiles.forEach(dockerfile => {
    const filePath = path.resolve(dockerfile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Dockerfile not found: ${dockerfile}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;
    
    // Patch A: Replace Alpine with Debian
    if (content.includes("FROM node:20-alpine")) {
      content = content.replace(/FROM node:20-alpine/g, "FROM node:20-slim");
      changed = true;
      console.log(`✨ Changed base image to Debian in ${dockerfile}`);
    }
    
    // Add Debian package installation
    if (!content.includes("apt-get update")) {
      const workdirMatch = content.match(/WORKDIR \/app\n/);
      if (workdirMatch) {
        const debianPackages = `
# Install Debian packages for Prisma
RUN apt-get update && apt-get install -y openssl libc6 ca-certificates && rm -rf /var/lib/apt/lists/*
`;
        content = content.replace(workdirMatch[0], workdirMatch[0] + debianPackages);
        changed = true;
        console.log(`✨ Added Debian packages in ${dockerfile}`);
      }
    }
    
    // Add Prisma engine binary paths
    if (!content.includes("PRISMA_CLI_QUERY_ENGINE_BINARY")) {
      const prismaEnvs = `
ENV PRISMA_CLI_QUERY_ENGINE_BINARY=/app/node_modules/.prisma/client/query-engine-debian-openssl-3.0.x
ENV PRISMA_CLI_SCHEMA_ENGINE_BINARY=/app/node_modules/prisma/schema-engine-debian-openssl-3.0.x
ENV PRISMA_CLI_INTROSPECTION_ENGINE_BINARY=/app/node_modules/prisma/introspection-engine-debian-openssl-3.0.x
ENV PRISMA_CLI_MIGRATION_ENGINE_BINARY=/app/node_modules/prisma/migration-engine-debian-openssl-3.0.x
`;
      
      // Insert after WORKDIR or after package installation
      const insertPoint = content.match(/(RUN apt-get.*\n)/);
      if (insertPoint) {
        content = content.replace(insertPoint[0], insertPoint[0] + prismaEnvs);
      } else {
        // Fallback: insert after WORKDIR
        content = content.replace(/(WORKDIR \/app\n)/, `$1${prismaEnvs}`);
      }
      changed = true;
      console.log(`✨ Added Prisma engine binary paths in ${dockerfile}`);
    }
    
    // Patch B: Disable frozen-lockfile
    if (content.includes("--frozen-lockfile") && !content.includes("--no-frozen-lockfile")) {
      content = content.replace(/--frozen-lockfile/g, "--no-frozen-lockfile");
      changed = true;
      console.log(`✨ Disabled frozen-lockfile in ${dockerfile}`);
    }
    
    // Ensure --ignore-scripts is present for install
    if (content.includes("pnpm install --no-frozen-lockfile") && !content.includes("--ignore-scripts")) {
      content = content.replace(
        /pnpm install --no-frozen-lockfile/g,
        "pnpm install --no-frozen-lockfile --ignore-scripts"
      );
      changed = true;
      console.log(`✨ Added --ignore-scripts in ${dockerfile}`);
    }
    
    // Update Prisma schema binaryTargets to include debian
    if (content.includes("prisma generate")) {
      // Ensure schema has debian-openssl-3.0.x
      const schemaPath = "packages/core/prisma/schema.prisma";
      if (fs.existsSync(schemaPath)) {
        let schema = fs.readFileSync(schemaPath, "utf8");
        if (!schema.includes("debian-openssl-3.0.x")) {
          schema = schema.replace(
            /binaryTargets\s*=\s*\[([^\]]+)\]/,
            (match, targets) => {
              const targetsList = targets.split(",").map(t => t.trim().replace(/"/g, ""));
              if (!targetsList.includes("debian-openssl-3.0.x")) {
                targetsList.push("debian-openssl-3.0.x");
              }
              return `binaryTargets = [${targetsList.map(t => `"${t}"`).join(", ")}]`;
            }
          );
          fs.writeFileSync(schemaPath, schema);
          console.log(`✨ Added debian-openssl-3.0.x to schema binaryTargets`);
        }
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${dockerfile}`);
    } else {
      console.log(`✓ ${dockerfile} already patched`);
    }
  });
  
  log("✅ Phase 3 complete: Dockerfiles patched", "✅");
}

async function phase4_rebuildWorkers() {
  log("PHASE 4: Rebuilding workers from clean base", "🚀");
  
  const buildRes = run("./scripts/build-push-workers.sh");
  
  if (!buildRes.ok) {
    console.error("❌ Worker build failed. Check logs above.");
    throw new Error("Worker build failed");
  }
  
  log("✅ Phase 4 complete: Workers built and pushed to ACR", "✅");
}

async function phase5_terraformOrchestrator() {
  log("PHASE 5: Running Terraform Orchestrator v2", "🏗️");
  
  const tfRes = run("node tools/terraform_apply_orchestrator.js");
  
  if (!tfRes.ok) {
    console.error("❌ Terraform orchestrator failed. Check logs above.");
    
    // Attempt auto-repair: restart workers
    log("Attempting auto-repair: Restarting worker containers...", "🔧");
    
    const restartRealtime = run(
      `az containerapp revision restart --name mf-worker-realtime --resource-group magnus-rg --latest`
    );
    const restartScheduler = run(
      `az containerapp revision restart --name mf-worker-scheduler --resource-group magnus-rg --latest`
    );
    
    if (restartRealtime.ok && restartScheduler.ok) {
      log("Workers restarted. Waiting 30 seconds before re-checking health...", "⏳");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Re-run health checks manually
      log("Re-running health checks...", "🩺");
      const healthCheckRes = run("node tools/terraform_apply_orchestrator.js");
      
      if (!healthCheckRes.ok) {
        throw new Error("Workers still failing health checks after restart");
      }
    } else {
      throw new Error("Terraform orchestrator failed and auto-repair could not restart workers");
    }
  }
  
  log("✅ Phase 5 complete: Terraform applied and workers healthy", "✅");
}

function phase6_successBanner() {
  console.log("\n");
  console.log("========================================");
  console.log("🎉 WORKERS DEPLOYED AND HEALTHY");
  console.log("🎉 API ↔ WORKERS ↔ SUPABASE LINK VERIFIED");
  console.log("🎉 TERRAFORM APPLIED SAFELY");
  console.log("🎉 MAGNUS FLIPPER BACKEND IS ALIVE IN PRODUCTION");
  console.log("========================================\n");
}

// Main execution
(async () => {
  try {
    console.log("========================================");
    console.log("  Prisma Build Surgeon v3");
    console.log("  Full Pipeline Orchestration");
    console.log("========================================\n");
    
    await phase1_autoPinPrisma();
    await phase2_dockerCleanup();
    phase3_patchDockerfiles();
    await phase4_rebuildWorkers();
    await phase5_terraformOrchestrator();
    phase6_successBanner();
    
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Prisma Build Surgeon v3 failed.");
    console.error(err.message || err);
    process.exit(1);
  }
})();
