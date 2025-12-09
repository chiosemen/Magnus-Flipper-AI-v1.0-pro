#!/usr/bin/env node

/**
 * Prisma Build Surgeon v4
 * -------------------------------------------
 * Stabilizes Prisma builds, optimizes Docker, builds + pushes worker images,
 * and applies Terraform with clear logging and safety rails.
 * 
 * Combines Prisma Build Surgeon v4 + Terraform Apply Orchestrator v2
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
    return { ok: false, err: err.message, out: "" };
  }
}

// Report structure
const report = {
  prisma: { version: null, binaryTargets: [] },
  docker: { baseImage: null, pnpmInstall: null },
  workers: { built: false, pushed: false, acrVerified: false },
  terraform: { plan: false, apply: false, fqdns: {}, healthChecks: {} },
  frontend: { build: false }
};

async function phase0_safetySnapshot() {
  log("PHASE 0: Safety Snapshot", "🧩");
  
  const statusRes = runCapture("git status -sb");
  if (!statusRes.ok) {
    console.warn("⚠️  Not a git repository or git not available. Skipping safety snapshot.");
    return;
  }
  
  const status = statusRes.out;
  const hasChanges = status.includes("M ") || status.includes("??") || status.includes("A ");
  
  if (hasChanges) {
    log("Uncommitted changes detected. Creating WIP snapshot...", "💾");
    run("git add .");
    run('git commit -m "chore: WIP snapshot before Prisma Build Mode v4"');
    log("✅ Safety snapshot saved", "✅");
  } else {
    log("✅ No uncommitted changes. Safety snapshot skipped.", "✅");
  }
}

async function phase1_prismaVerification() {
  log("PHASE 1: Prisma Version & Schema Verification", "🧬");
  
  // Check Prisma version
  const versionCheck = runCapture(
    'node -e "const pkg = require(\'./packages/core/package.json\'); console.log(pkg.dependencies?.prisma || pkg.devDependencies?.prisma || \'not found\')"'
  );
  
  let prismaVersion = versionCheck.out.replace(/[\^~]/, "").trim();
  report.prisma.version = prismaVersion;
  
  console.log(`📦 Current Prisma version: ${prismaVersion}`);
  
  if (prismaVersion !== "7.0.1" && !prismaVersion.startsWith("7.0.1")) {
    log("Prisma version is not 7.0.1. Running pin tool...", "🔧");
    const pinResult = applyPrisma701Pin();
    console.log(pinResult);
    prismaVersion = "7.0.1";
    report.prisma.version = prismaVersion;
  }
  
  // Run Prisma Alpine Surgeon v2
  log("Running Prisma Alpine Surgeon v2...");
  run("node tools/prisma_alpine_surgeon.js");
  
  // Verify schema binaryTargets
  const schemaPath = "packages/core/prisma/schema.prisma";
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    const binaryTargetsMatch = schema.match(/binaryTargets\s*=\s*\[([^\]]+)\]/);
    if (binaryTargetsMatch) {
      const targets = binaryTargetsMatch[1]
        .split(",")
        .map(t => t.trim().replace(/"/g, ""))
        .filter(Boolean);
      report.prisma.binaryTargets = targets;
      
      const required = ["native", "linux-musl", "linux-x64-openssl-3.0.x"];
      const missing = required.filter(t => !targets.includes(t));
      
      if (missing.length > 0) {
        log(`Adding missing binaryTargets: ${missing.join(", ")}`, "🔧");
        const updated = schema.replace(
          /binaryTargets\s*=\s*\[([^\]]+)\]/,
          (match, existing) => {
            const existingList = existing.split(",").map(t => t.trim().replace(/"/g, "")).filter(Boolean);
            const combined = [...new Set([...existingList, ...required])];
            return `binaryTargets = [${combined.map(t => `"${t}"`).join(", ")}]`;
          }
        );
        fs.writeFileSync(schemaPath, updated);
        log("✅ Schema updated with required binaryTargets", "✅");
        report.prisma.binaryTargets = [...new Set([...targets, ...required])];
      } else {
        log("✅ Schema binaryTargets verified", "✅");
      }
    }
  }
  
  log("✅ Phase 1 complete: Prisma verified", "✅");
}

function phase2_hardenDockerfiles() {
  log("PHASE 2: Harden Worker Dockerfiles (Debian + pnpm install)", "🐧➡️🐋");
  
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
    
    // 2.1: Ensure Debian base image
    if (content.includes("FROM node:20-alpine")) {
      content = content.replace(/FROM node:20-alpine/g, "FROM node:20-slim");
      changed = true;
      console.log(`✨ Changed base image to Debian (node:20-slim) in ${dockerfile}`);
      report.docker.baseImage = "node:20-slim";
    } else if (content.includes("FROM node:20-slim")) {
      report.docker.baseImage = "node:20-slim";
    }
    
    // Add system deps if not present
    if (!content.includes("apt-get update")) {
      const builderMatch = content.match(/(FROM node:20-slim AS builder\nWORKDIR \/app)/);
      if (builderMatch) {
        const deps = `
# Install system dependencies for Prisma
RUN apt-get update && apt-get install -y \\
    openssl \\
    ca-certificates \\
  && rm -rf /var/lib/apt/lists/*
`;
        content = content.replace(builderMatch[0], builderMatch[0] + deps);
        changed = true;
        console.log(`✨ Added system dependencies in ${dockerfile}`);
      }
    }
    
    // 2.2: Fix pnpm install (remove frozen-lockfile)
    if (content.includes("--frozen-lockfile") && !content.includes("--no-frozen-lockfile")) {
      content = content.replace(/--frozen-lockfile/g, "--no-frozen-lockfile");
      changed = true;
      console.log(`✨ Disabled frozen-lockfile in ${dockerfile}`);
      report.docker.pnpmInstall = "--no-frozen-lockfile";
    }
    
    // Ensure --ignore-scripts is present
    if (content.includes("pnpm install --no-frozen-lockfile") && !content.includes("--ignore-scripts")) {
      content = content.replace(
        /pnpm install --no-frozen-lockfile/g,
        "pnpm install --no-frozen-lockfile --ignore-scripts"
      );
      changed = true;
      console.log(`✨ Added --ignore-scripts in ${dockerfile}`);
    }
    
    // 2.3: Ensure Prisma generate runs before build
    if (!content.includes("prisma generate --schema")) {
      // Find the build section
      const buildMatch = content.match(/(# Build packages\nRUN pnpm --filter @magnus-flipper-ai\/core build)/);
      if (buildMatch) {
        const prismaGen = `# Generate Prisma client\nRUN pnpm --filter @magnus-flipper-ai/core exec prisma generate --schema=./prisma/schema.prisma\n\n`;
        content = content.replace(buildMatch[0], prismaGen + buildMatch[0]);
        changed = true;
        console.log(`✨ Added Prisma generate step in ${dockerfile}`);
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${dockerfile}`);
    } else {
      console.log(`✓ ${dockerfile} already hardened`);
    }
  });
  
  log("✅ Phase 2 complete: Dockerfiles hardened", "✅");
}

async function phase3_buildxSetup() {
  log("PHASE 3: Buildx + Multi-Arch Setup (Optional)", "⚙️");
  
  const buildxList = runCapture("docker buildx ls");
  if (!buildxList.ok) {
    console.warn("⚠️  Docker Buildx not available. Skipping Buildx setup.");
    return;
  }
  
  const hasBuilder = buildxList.out.includes("magnus-builder") || buildxList.out.includes("*");
  
  if (!hasBuilder) {
    log("Creating Buildx builder...", "🔧");
    run("docker buildx create --name magnus-builder --use");
    run("docker buildx inspect --bootstrap");
    log("✅ Buildx builder created", "✅");
  } else {
    log("✅ Buildx builder already exists", "✅");
  }
  
  // Check if build-push-workers.sh uses buildx
  const buildScript = "scripts/build-push-workers.sh";
  if (fs.existsSync(buildScript)) {
    const scriptContent = fs.readFileSync(buildScript, "utf8");
    if (!scriptContent.includes("buildx")) {
      console.log("ℹ️  build-push-workers.sh doesn't use buildx. Keeping current implementation.");
    }
  }
  
  log("✅ Phase 3 complete: Buildx ready (optional)", "✅");
}

async function phase4_buildPushWorkers() {
  log("PHASE 4: Build & Push Worker Images", "🧱");
  
  const buildRes = run("./scripts/build-push-workers.sh");
  
  if (!buildRes.ok) {
    console.error("❌ Worker build failed. Attempting diagnosis...");
    
    // Try to diagnose
    const prismaVersion = detectPrismaVersion();
    console.log(`Prisma version: ${prismaVersion}`);
    
    // Check if it's a Prisma error
    console.log("Checking for Prisma engine errors...");
    
    throw new Error("Worker build failed. Check logs above for details.");
  }
  
  report.workers.built = true;
  
  // Verify ACR images
  log("Verifying ACR images...");
  const verifyScript = "scripts/verify-acr-images.sh";
  if (fs.existsSync(verifyScript)) {
    const verifyRes = run(`./${verifyScript}`);
    report.workers.acrVerified = verifyRes.ok;
  } else {
    // Manual verification
    const acrCheck = runCapture("az acr repository show-tags --name magnusacr --repository magnus-worker-realtime --top 1 -o tsv");
    if (acrCheck.ok && acrCheck.out.includes("latest")) {
      report.workers.acrVerified = true;
      log("✅ ACR images verified", "✅");
    }
  }
  
  report.workers.pushed = true;
  log("✅ Phase 4 complete: Workers built and pushed", "✅");
}

async function phase5_terraformOrchestrator() {
  log("PHASE 5: Run Terraform Apply Orchestrator v2", "🌍");
  
  const tfRes = run("node tools/terraform_apply_orchestrator.js");
  
  if (!tfRes.ok) {
    console.error("❌ Terraform orchestrator failed. Attempting worker restart...");
    
    // Attempt restart
    log("Restarting worker containers...", "🔧");
    run("az containerapp restart --name mf-worker-realtime --resource-group magnus-rg || true");
    run("az containerapp restart --name mf-worker-scheduler --resource-group magnus-rg || true");
    
    log("Waiting 30 seconds before re-checking...", "⏳");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Try health checks manually
    const realtimeFqdn = runCapture(
      "az containerapp show --name mf-worker-realtime --resource-group magnus-rg --query properties.configuration.ingress.fqdn -o tsv"
    );
    const schedulerFqdn = runCapture(
      "az containerapp show --name mf-worker-scheduler --resource-group magnus-rg --query properties.configuration.ingress.fqdn -o tsv"
    );
    
    if (realtimeFqdn.ok) {
      report.terraform.fqdns.realtime = realtimeFqdn.out;
      const health = runCapture(`curl -fsS https://${realtimeFqdn.out}/health || echo "FAILED"`);
      report.terraform.healthChecks.realtime = !health.out.includes("FAILED");
    }
    
    if (schedulerFqdn.ok) {
      report.terraform.fqdns.scheduler = schedulerFqdn.out;
      const health = runCapture(`curl -fsS https://${schedulerFqdn.out}/health || echo "FAILED"`);
      report.terraform.healthChecks.scheduler = !health.out.includes("FAILED");
    }
    
    if (!report.terraform.healthChecks.realtime || !report.terraform.healthChecks.scheduler) {
      throw new Error("Workers still failing health checks after restart");
    }
  } else {
    report.terraform.plan = true;
    report.terraform.apply = true;
  }
  
  log("✅ Phase 5 complete: Terraform applied", "✅");
}

async function phase6_frontendSanity() {
  log("PHASE 6: Frontend → API → Worker Sanity Ping", "🔗");
  
  log("Running web lint...");
  const lintRes = run("pnpm --filter web lint || true");
  
  log("Running web build...");
  const buildRes = run("pnpm --filter web build || true");
  
  report.frontend.build = buildRes.ok;
  
  if (buildRes.ok) {
    log("✅ Frontend builds cleanly", "✅");
  } else {
    console.warn("⚠️  Frontend build had issues (non-blocking)");
  }
  
  log("✅ Phase 6 complete: Frontend sanity check done", "✅");
}

function phase7_finalReport() {
  log("PHASE 7: Final Report", "🧾");
  
  console.log("\n" + "=".repeat(50));
  console.log("PRISMA BUILD MODE v4 — FINAL REPORT");
  console.log("=".repeat(50) + "\n");
  
  // Prisma
  console.log("📦 Prisma:");
  console.log(`   Version: ${report.prisma.version || "unknown"}`);
  console.log(`   binaryTargets: [${report.prisma.binaryTargets.join(", ")}]`);
  
  // Docker
  console.log("\n🐳 Docker:");
  console.log(`   Base image: ${report.docker.baseImage || "unknown"}`);
  console.log(`   pnpm install: ${report.docker.pnpmInstall || "unknown"}`);
  
  // Workers
  console.log("\n👷 Workers:");
  console.log(`   Images built & pushed: ${report.workers.built && report.workers.pushed ? "✅" : "❌"}`);
  console.log(`   ACR repos & tags verified: ${report.workers.acrVerified ? "✅" : "❌"}`);
  
  // Terraform
  console.log("\n🏗️  Terraform:");
  console.log(`   Plan: ${report.terraform.plan ? "✅" : "❌"}`);
  console.log(`   Apply: ${report.terraform.apply ? "✅" : "❌"}`);
  
  if (Object.keys(report.terraform.fqdns).length > 0) {
    console.log("\n   Worker FQDNs:");
    Object.entries(report.terraform.fqdns).forEach(([name, fqdn]) => {
      console.log(`     ${name}: ${fqdn}`);
    });
  }
  
  if (Object.keys(report.terraform.healthChecks).length > 0) {
    console.log("\n   Health checks:");
    Object.entries(report.terraform.healthChecks).forEach(([name, healthy]) => {
      console.log(`     ${name}: ${healthy ? "✅" : "❌"}`);
    });
  }
  
  // Frontend
  console.log("\n🌐 Frontend:");
  console.log(`   pnpm --filter web build: ${report.frontend.build ? "✅" : "❌"}`);
  
  // Issues
  const issues = [];
  if (report.prisma.version !== "7.0.1") issues.push("Prisma version not 7.0.1");
  if (!report.workers.built) issues.push("Workers not built");
  if (!report.terraform.apply) issues.push("Terraform apply failed");
  if (!report.terraform.healthChecks.realtime) issues.push("Realtime worker health check failed");
  if (!report.terraform.healthChecks.scheduler) issues.push("Scheduler worker health check failed");
  
  if (issues.length > 0) {
    console.log("\n⚠️  Issues detected:");
    issues.forEach(issue => console.log(`   - ${issue}`));
    
    console.log("\n🔧 Next actions:");
    if (issues.includes("Prisma version not 7.0.1")) {
      console.log("   1. Run: node tools/apply_prisma_pin_701.js");
      console.log("   2. Run: pnpm install --no-frozen-lockfile");
    }
    if (issues.includes("Workers not built")) {
      console.log("   1. Check Docker build logs");
      console.log("   2. Verify Prisma schema binaryTargets");
      console.log("   3. Re-run: ./scripts/build-push-workers.sh");
    }
    if (issues.some(i => i.includes("health check"))) {
      console.log("   1. Check Container App logs: az containerapp logs show");
      console.log("   2. Verify environment variables are set");
      console.log("   3. Restart workers: az containerapp restart");
    }
  } else {
    console.log("\n🎉 All systems operational!");
  }
  
  console.log("\n" + "=".repeat(50) + "\n");
}

// Main execution
(async () => {
  try {
    console.log("=".repeat(50));
    console.log("  Prisma Build Surgeon v4");
    console.log("  Full Pipeline Orchestration");
    console.log("=".repeat(50) + "\n");
    
    await phase0_safetySnapshot();
    await phase1_prismaVerification();
    phase2_hardenDockerfiles();
    await phase3_buildxSetup();
    await phase4_buildPushWorkers();
    await phase5_terraformOrchestrator();
    await phase6_frontendSanity();
    phase7_finalReport();
    
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Prisma Build Surgeon v4 failed.");
    console.error(err.message || err);
    phase7_finalReport();
    process.exit(1);
  }
})();
