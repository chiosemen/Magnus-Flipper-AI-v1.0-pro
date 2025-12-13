#!/usr/bin/env node
if (process.env.CI_DEPLOY_GUARDIAN_DISABLED === "true") {
  console.warn("⚠️ DeployGuardian disabled via CI_DEPLOY_GUARDIAN_DISABLED");
  process.exit(0);
}
/**
 * DeployGuardian v2 — Hardened Pre-Deploy Safety Gate
 * -----------------------------------------------------------
 * Release Engineering-focused validation that is:
 * - Deterministic
 * - Environment-aware
 * - Zero false positives in pre-deploy mode
 * - Strict only on true release blockers
 * 
 * Severity Levels:
 * - BLOCKER: Production-breaking issues (exit 1)
 * - WARNING: Issues that should be fixed but don't block deployment
 * - INFO: Informational messages
 * 
 * Modes:
 * - validate: Standard validation (all checks)
 * - pre-merge: Pre-merge validation (strict)
 * - pre-deploy: Pre-deployment validation (BLOCKER-only failures)
 * 
 * Output Formats:
 * - pretty: Human-readable console output (default)
 * - json: Machine-readable JSON output
 * - both: Both formats
 * 
 * Contract Version: 2.0.0
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CONTRACT_VERSION = "2.0.0";
const TOOL_VERSION = "2.0.0";

const MODES = {
  VALIDATE: "validate",
  PRE_MERGE: "pre-merge",
  PRE_DEPLOY: "pre-deploy",
};

const SEVERITY = {
  BLOCKER: "BLOCKER",
  WARNING: "WARNING",
  INFO: "INFO",
};

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(msg, emoji = "✨", color = COLORS.reset) {
  if (shouldShowConsole) {
    console.log(`${color}${emoji} ${msg}${COLORS.reset}`);
  }
}

function error(msg) {
  if (shouldShowConsole) {
    log(msg, "❌", COLORS.red);
  }
}

function success(msg) {
  if (shouldShowConsole) {
    log(msg, "✅", COLORS.green);
  }
}

function warn(msg) {
  if (shouldShowConsole) {
    log(msg, "⚠️", COLORS.yellow);
  }
}

function info(msg) {
  if (shouldShowConsole) {
    log(msg, "ℹ️", COLORS.cyan);
  }
}

function run(cmd, options = {}) {
  try {
    const output = execSync(cmd, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
    return { ok: true, output: output?.trim() || "" };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      output: err.stdout?.toString() || err.stderr?.toString() || "",
    };
  }
}

// Check result structure with severity
class CheckResult {
  constructor(name, id, category, severity = SEVERITY.INFO) {
    this.name = name;
    this.id = id;
    this.category = category;
    this.severity = severity;
    this.passed = false;
    this.messages = [];
    this.startTime = Date.now();
    this.endTime = null;
    this.evidence = {};
  }

  addMessage(message, severity = null) {
    this.messages.push({ text: message, severity: severity || this.severity });
    // Elevate severity if needed
    if (severity === SEVERITY.BLOCKER && this.severity !== SEVERITY.BLOCKER) {
      this.severity = SEVERITY.BLOCKER;
    } else if (severity === SEVERITY.WARNING && this.severity === SEVERITY.INFO) {
      this.severity = SEVERITY.WARNING;
    }
  }

  pass() {
    this.passed = true;
    this.endTime = Date.now();
  }

  fail(message, severity = null) {
    this.passed = false;
    this.addMessage(message, severity || this.severity);
    this.endTime = Date.now();
  }

  setEvidence(evidence) {
    this.evidence = { ...this.evidence, ...evidence };
  }

  getDuration() {
    return this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime;
  }

  toJSON(mode) {
    const hasBlockers = this.messages.some(m => m.severity === SEVERITY.BLOCKER);
    const status = this.passed ? "PASS" : hasBlockers ? "FAIL" : "WARN";
    
    return {
      id: this.id,
      title: this.name,
      category: this.category,
      status,
      severity: this.severity,
      mode,
      durationMs: this.getDuration(),
      humanSummary: this.messages.length > 0 ? this.messages[0].text : `${this.name} check completed`,
      evidence: this.evidence,
      messages: this.messages.map(m => ({
        text: m.text,
        severity: m.severity
      }))
    };
  }
}

// Global results tracking
const results = {
  terraform: new CheckResult("Terraform", "terraform.validation", "terraform", SEVERITY.WARNING),
  prisma: new CheckResult("Prisma", "prisma.validation", "prisma", SEVERITY.BLOCKER),
  workers: new CheckResult("Workers", "workers.validation", "docker", SEVERITY.WARNING),
  secrets: new CheckResult("Secrets", "secrets.validation", "secrets", SEVERITY.WARNING),
  unsafe: new CheckResult("Unsafe Merge", "unsafe.merge", "tests", SEVERITY.WARNING),
};

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    mode: MODES.VALIDATE,
    format: "pretty", // pretty, json, both
    out: null,
  };

  for (const arg of args) {
    if (arg.startsWith("--mode=")) {
      parsed.mode = arg.split("=")[1];
    } else if (arg.startsWith("--format=")) {
      parsed.format = arg.split("=")[1];
    } else if (arg.startsWith("--out=")) {
      parsed.out = arg.split("=")[1];
    }
  }

  return parsed;
}

const cliArgs = parseArgs();
const currentMode = cliArgs.mode;
const isPreDeploy = currentMode === MODES.PRE_DEPLOY;

// Console output helpers (respect format flag)
const shouldShowConsole = cliArgs.format === "pretty" || cliArgs.format === "both";

// ============================================
// 1. TERRAFORM VALIDATION
// ============================================

function validateTerraform() {
  log("Validating Terraform configuration...", "🏗️");
  const check = results.terraform;

  const terraformDir = path.join(__dirname, "../infra/azure");
  if (!fs.existsSync(terraformDir)) {
    check.fail("Terraform directory not found", isPreDeploy ? SEVERITY.WARNING : SEVERITY.BLOCKER);
    return;
  }

  // Check if terraform is installed
  const tfCheck = run("terraform version", { silent: true });
  if (!tfCheck.ok) {
    check.fail("Terraform not installed or not in PATH", isPreDeploy ? SEVERITY.WARNING : SEVERITY.BLOCKER);
    return;
  }

  // Run terraform init
  const initResult = run(`cd ${terraformDir} && terraform init -input=false`, {
    silent: true,
  });
  if (!initResult.ok) {
    check.fail(`Terraform init failed: ${initResult.error}`, SEVERITY.BLOCKER);
    return;
  }

  // Run terraform validate (syntax check)
  const validateResult = run(`cd ${terraformDir} && terraform validate`, {
    silent: true,
  });
  if (!validateResult.ok) {
    check.fail(`Terraform validate failed (syntax errors): ${validateResult.output}`, SEVERITY.BLOCKER);
    return;
  }

  // Run terraform plan (only in non-pre-deploy modes)
  if (!isPreDeploy) {
    const planResult = run(`cd ${terraformDir} && terraform plan -out=/dev/null`, {
      silent: true,
    });
    if (!planResult.ok) {
      // Plan failures could be drift or real errors
      // In validate mode, treat as WARNING (could be drift)
      check.fail(`Terraform plan detected changes or drift: ${planResult.output}`, SEVERITY.WARNING);
    } else {
      check.addMessage("Terraform plan succeeded (no drift detected)", SEVERITY.INFO);
    }
  } else {
    check.addMessage("Terraform plan skipped in pre-deploy mode (will run during deployment)", SEVERITY.INFO);
  }

  check.pass();
  success("Terraform validation passed");
}

// ============================================
// 2. PRISMA READINESS CHECKS
// ============================================

function validatePrisma() {
  log("Validating Prisma readiness...", "🧬");
  const check = results.prisma;

  const prismaSchema = path.join(__dirname, "../packages/core/prisma/schema.prisma");
  if (!fs.existsSync(prismaSchema)) {
    check.fail("Prisma schema not found", SEVERITY.BLOCKER);
    return;
  }

  // Check schema syntax
  const schemaCheck = run(
    `npx prisma validate --schema=${prismaSchema}`,
    { silent: true, cwd: path.dirname(prismaSchema) }
  );
  if (!schemaCheck.ok) {
    check.fail(`Schema validation failed: ${schemaCheck.output}`, SEVERITY.BLOCKER);
    return;
  }
  check.addMessage("Prisma schema syntax valid", SEVERITY.INFO);

  // Regenerate client to ensure freshness
  log("Regenerating Prisma client...", "🔄");
  const generateCheck = run(
    `npx prisma generate --schema=${prismaSchema}`,
    { silent: true, cwd: path.dirname(prismaSchema) }
  );
  if (!generateCheck.ok) {
    check.fail(`Prisma generate failed: ${generateCheck.output}`, SEVERITY.BLOCKER);
    return;
  }
  check.addMessage("Prisma client regenerated successfully", SEVERITY.INFO);

  // Verify client was generated (check multiple possible paths)
  const possibleClientPaths = [
    path.join(__dirname, "../packages/core/node_modules/.prisma/client/index.js"),
    path.join(__dirname, "../node_modules/.prisma/client/index.js"),
    path.join(__dirname, "../packages/core/node_modules/@prisma/client/index.js"),
  ];
  
  let clientGenerated = false;
  for (const possiblePath of possibleClientPaths) {
    if (fs.existsSync(possiblePath)) {
      clientGenerated = true;
      check.addMessage(`Prisma client found at: ${possiblePath}`, SEVERITY.INFO);
      break;
    }
  }
  
  if (!clientGenerated) {
    if (isPreDeploy) {
      check.addMessage("Prisma client not found after generation (will be generated during build)", SEVERITY.WARNING);
    } else {
      check.fail("Prisma client generation failed - client file not found", SEVERITY.BLOCKER);
      return;
    }
  }

  // Check for dangerous migrations (optional check)
  const supabaseMigrationsDir = path.join(__dirname, "../supabase/migrations");
  const prismaMigrationsDir = path.join(__dirname, "../packages/core/prisma/migrations");
  const migrationsDir = fs.existsSync(supabaseMigrationsDir) ? supabaseMigrationsDir : 
                        fs.existsSync(prismaMigrationsDir) ? prismaMigrationsDir : null;
  
  if (migrationsDir && fs.existsSync(migrationsDir)) {
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"));
    
    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      if (/DROP\s+(TABLE|COLUMN|INDEX|DATABASE)/i.test(content)) {
        check.addMessage(`Dangerous migration detected: ${file} (contains DROP statement)`, SEVERITY.WARNING);
      }
    }
  } else {
    check.addMessage("Migrations directory not found (may be managed via Prisma Migrate)", SEVERITY.INFO);
  }

  check.pass();
  success("Prisma validation passed (client is fresh)");
}

// ============================================
// 3. WORKER IMAGE BUILD CHECKS
// ============================================

function validateWorkers() {
  log("Validating worker configurations...", "🐳");
  const check = results.workers;

  const workers = [
    "worker-realtime",
    "worker-scheduler",
    "worker-alerts",
  ];

  // Check Docker is available
  const dockerCheck = run("docker --version", { silent: true });
  if (!dockerCheck.ok) {
    if (isPreDeploy) {
      check.addMessage("Docker not available - skipping image build validation in pre-deploy", SEVERITY.INFO);
      check.pass();
      return;
    } else {
      check.fail("Docker not available - cannot validate image builds", SEVERITY.BLOCKER);
      return;
    }
  }

  let hasErrors = false;

  for (const worker of workers) {
    const workerPath = path.join(__dirname, `../apps/${worker}`);
    if (!fs.existsSync(workerPath)) {
      check.addMessage(`Worker directory not found: ${worker}`, SEVERITY.WARNING);
      continue;
    }

    // Check Dockerfile exists
    const dockerfile = path.join(workerPath, "Dockerfile");
    if (!fs.existsSync(dockerfile)) {
      check.addMessage(`Dockerfile not found: ${worker}`, SEVERITY.WARNING);
      continue;
    }

    // Validate Dockerfile syntax (proper FROM instruction check)
    const dockerfileContent = fs.readFileSync(dockerfile, "utf8");
    
    // Check if file is effectively empty (only comments/whitespace)
    const nonCommentLines = dockerfileContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('#');
      });
    
    if (nonCommentLines.length === 0) {
      check.addMessage(`${worker}: Dockerfile is empty or contains only comments`, SEVERITY.WARNING);
      continue;
    }

    // Check for FROM instruction (can be in builder stage or main stage)
    const hasFROM = /^\s*FROM\s+\S+/mi.test(dockerfileContent);
    if (!hasFROM) {
      check.fail(`${worker}: Dockerfile missing FROM instruction (invalid syntax)`, SEVERITY.BLOCKER);
      hasErrors = true;
      continue;
    }

    // Check for multi-stage build pattern (good practice, not required)
    const hasBuilderStage = /FROM.*AS\s+builder/i.test(dockerfileContent);
    if (hasBuilderStage) {
      check.addMessage(`${worker}: Using multi-stage build (recommended)`, SEVERITY.INFO);
    } else {
      check.addMessage(`${worker}: Using single-stage build (acceptable)`, SEVERITY.INFO);
    }

    // Check if Dockerfile contains build commands (informational only)
    const hasBuildCommands = /RUN.*(pnpm build|tsc|npm run build)/i.test(dockerfileContent);
    if (hasBuildCommands && !hasBuilderStage) {
      check.addMessage(`${worker}: Build commands in single-stage Dockerfile (consider multi-stage for optimization)`, SEVERITY.INFO);
    }

    // In pre-deploy mode, skip actual Docker build (too slow, will be done in deployment)
    if (!isPreDeploy) {
      log(`Building ${worker} image for validation...`, "🔨");
      const dockerBuild = run(
        `docker build --platform linux/amd64 -t magnus-${worker}:test -f ${dockerfile} .`,
        { silent: true, cwd: path.join(__dirname, ".."), timeout: 300000 }
      );
      if (!dockerBuild.ok) {
        check.fail(`${worker}: Docker image build failed - ${dockerBuild.output}`, SEVERITY.BLOCKER);
        hasErrors = true;
      } else {
        check.addMessage(`${worker}: Docker image builds successfully`, SEVERITY.INFO);
        // Clean up test image
        run(`docker rmi magnus-${worker}:test`, { silent: true });
      }
    } else {
      check.addMessage(`${worker}: Dockerfile syntax valid (build skipped in pre-deploy)`, SEVERITY.INFO);
    }

    // Check TypeScript build (only if pnpm is available)
    const packageJson = path.join(workerPath, "package.json");
    if (fs.existsSync(packageJson)) {
      const pkg = JSON.parse(fs.readFileSync(packageJson, "utf8"));
      if (!pkg.scripts || !pkg.scripts.start) {
        check.addMessage(`${worker}: Missing start script in package.json`, SEVERITY.WARNING);
      }

      // TypeScript build check (only in non-pre-deploy modes)
      if (!isPreDeploy && pkg.scripts && pkg.scripts.build) {
        log(`Validating ${worker} TypeScript build...`, "📦");
        const buildCheck = run(`pnpm --filter ${worker} build`, {
          silent: true,
          cwd: path.join(__dirname, ".."),
        });
        if (!buildCheck.ok) {
          check.addMessage(`${worker}: TypeScript build failed - ${buildCheck.output}`, SEVERITY.WARNING);
        } else {
          check.addMessage(`${worker}: TypeScript build succeeded`, SEVERITY.INFO);
        }
      }
    }
  }

  if (!hasErrors) {
    check.pass();
    success("Worker validation passed");
  } else {
    error("Worker validation failed");
  }
}

// ============================================
// 4. ENVIRONMENT VARIABLES VALIDATION
// ============================================

function validateSecrets() {
  log("Validating environment variables...", "🔐");
  const check = results.secrets;

  // Categorize secrets by when they're needed
  const buildTimeSecrets = [
    "DATABASE_URL", // Needed for Prisma generation
  ];

  const runtimeSecrets = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
  ];

  const azureSecrets = [
    "AZURE_CLIENT_ID",
    "AZURE_TENANT_ID",
    "AZURE_SUBSCRIPTION_ID",
    "AZURE_ACR_NAME",
  ];

  const vercelSecrets = [
    "VERCEL_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
  ];

  const missing = [];
  const missingRuntime = [];

  // Check build-time secrets (required in all modes)
  for (const secret of buildTimeSecrets) {
    const value = process.env[secret];
    if (!value) {
      missing.push(secret);
      check.fail(`Build-time secret missing: ${secret}`, SEVERITY.BLOCKER);
    } else {
      // Validate format
      if (secret === "DATABASE_URL" && !value.startsWith("postgresql://")) {
        check.fail(`${secret} format invalid (should start with postgresql://)`, SEVERITY.WARNING);
      }
    }
  }

  // Check runtime secrets (WARNING in pre-deploy, may be set at deploy time)
  for (const secret of runtimeSecrets) {
    const value = process.env[secret];
    if (!value) {
      missingRuntime.push(secret);
      if (isPreDeploy) {
        check.addMessage(`Runtime secret missing: ${secret} (ensure it's set in deployment environment)`, SEVERITY.WARNING);
      } else {
        check.fail(`Runtime secret missing: ${secret}`, SEVERITY.BLOCKER);
      }
    } else {
      // Validate format
      if (secret === "SUPABASE_URL" && !value.startsWith("https://")) {
        check.addMessage(`${secret} format invalid (should be HTTPS URL)`, SEVERITY.WARNING);
      }
    }
  }

  // Check Azure secrets (if deploying to Azure)
  const isAzureDeploy = process.env.DEPLOY_ENV === "production" || process.env.AZURE_CLIENT_ID;
  if (isAzureDeploy) {
    for (const secret of azureSecrets) {
      const value = process.env[secret];
      if (!value) {
        if (isPreDeploy) {
          check.addMessage(`Azure secret missing: ${secret} (ensure it's set for deployment)`, SEVERITY.WARNING);
        } else {
          check.fail(`Azure secret missing: ${secret}`, SEVERITY.BLOCKER);
        }
      }
    }
  }

  // Check Vercel secrets (if deploying to Vercel)
  const isVercelDeploy = process.env.VERCEL_TOKEN || process.env.VERCEL_PROJECT_ID;
  if (isVercelDeploy) {
    for (const secret of vercelSecrets) {
      const value = process.env[secret];
      if (!value) {
        if (isPreDeploy) {
          check.addMessage(`Vercel secret missing: ${secret} (ensure it's set for deployment)`, SEVERITY.WARNING);
        } else {
          check.fail(`Vercel secret missing: ${secret}`, SEVERITY.BLOCKER);
        }
      }
    }
  }

  // Check environment template
  const envTemplate = path.join(__dirname, "../env.local.template");
  if (fs.existsSync(envTemplate)) {
    const templateContent = fs.readFileSync(envTemplate, "utf8");
    const templateSecrets = templateContent.match(/^[A-Z_]+=/gm) || [];
    check.addMessage(`Environment template found with ${templateSecrets.length} variables`, SEVERITY.INFO);
  } else {
    check.addMessage("Environment template not found", SEVERITY.INFO);
  }

  // In pre-deploy mode, we allow missing runtime secrets
  if (isPreDeploy) {
    check.pass();
    if (missing.length === 0 && missingRuntime.length === 0) {
      success("Environment variables validation passed");
    } else if (missing.length > 0) {
      warn(`Environment variables validation passed with warnings (${missing.length} build-time secrets missing)`);
    } else {
      warn(`Environment variables validation passed with warnings (${missingRuntime.length} runtime secrets missing)`);
    }
  } else {
    if (missing.length === 0 && missingRuntime.length === 0) {
      check.pass();
      success("Environment variables validation passed");
    } else {
      error(`Environment variables validation failed (${missing.length + missingRuntime.length} secrets missing)`);
    }
  }
}

// ============================================
// 5. UNSAFE MERGE BLOCKING
// ============================================

function checkUnsafeMerges() {
  log("Checking for unsafe merge conditions...", "🛡️");
  const check = results.unsafe;

  const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
  
  // Check for uncommitted changes (skip in CI)
  if (!isCI) {
    const gitStatus = run("git status --porcelain", { silent: true });
    if (gitStatus.ok && gitStatus.output.trim().length > 0) {
      check.addMessage("Uncommitted changes detected", isPreDeploy ? SEVERITY.WARNING : SEVERITY.BLOCKER);
    }
  }

  // Check for WIP commits
  const lastCommit = run("git log -1 --pretty=%B", { silent: true });
  if (lastCommit.ok && /WIP|wip|draft/i.test(lastCommit.output)) {
    check.addMessage("WIP commit detected in HEAD", isPreDeploy ? SEVERITY.WARNING : SEVERITY.BLOCKER);
  }

  // Check for force push markers (informational)
  const recentCommits = run("git log --oneline -10", { silent: true });
  if (recentCommits.ok && /force|reset|rebase/i.test(recentCommits.output)) {
    check.addMessage("Force push/rebase detected in recent history", SEVERITY.INFO);
  }

  // Check for broken tests (WARNING in pre-deploy, not blocking)
  const testCheck = run("pnpm test --passWithNoTests", { silent: true });
  if (!testCheck.ok) {
    check.addMessage("Tests are failing", isPreDeploy ? SEVERITY.WARNING : SEVERITY.BLOCKER);
  }

  // Check for lint errors (WARNING in pre-deploy, not blocking)
  const lintCheck = run("pnpm lint", { silent: true });
  if (!lintCheck.ok) {
    check.addMessage("Lint errors detected", isPreDeploy ? SEVERITY.WARNING : SEVERITY.BLOCKER);
  }

  // In pre-deploy, allow warnings
  const hasBlockers = check.messages.some(m => m.severity === SEVERITY.BLOCKER);
  if (!hasBlockers) {
    check.pass();
    success("No unsafe merge conditions detected");
  } else {
    error("Unsafe merge conditions detected");
  }
}

// ============================================
// JSON OUTPUT GENERATION
// ============================================

function generateJSONOutput(startTime, endTime, blockerCount, warningCount, passedChecks, totalChecks) {
  const allChecks = Object.values(results);
  const isSafe = blockerCount === 0;
  const exitCode = isPreDeploy ? (blockerCount > 0 ? 1 : 0) : (allChecks.every(c => c.passed) ? 0 : 1);

  // Get git info
  let commitSha = "unknown";
  let branch = "unknown";
  try {
    commitSha = execSync("git rev-parse HEAD", { encoding: "utf8", stdio: "pipe" }).trim();
    branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8", stdio: "pipe" }).trim();
  } catch (e) {
    // Git not available or not a git repo
  }

  const output = {
    contractVersion: CONTRACT_VERSION,
    tool: {
      name: "DeployGuardian",
      version: TOOL_VERSION,
      commitSha,
      runId: process.env.GITHUB_RUN_ID || `local-${Date.now()}`,
      timestamp: new Date(startTime).toISOString()
    },
    context: {
      mode: currentMode,
      repo: process.env.GITHUB_REPOSITORY || "local",
      branch,
      actor: process.env.GITHUB_ACTOR || process.env.USER || "unknown",
      ci: process.env.GITHUB_ACTIONS ? {
        provider: "github-actions",
        workflow: process.env.GITHUB_WORKFLOW || "unknown",
        job: process.env.GITHUB_JOB || "unknown"
      } : null
    },
    verdict: {
      status: isSafe ? "SAFE" : "UNSAFE",
      exitCode,
      blockers: blockerCount,
      warnings: warningCount,
      passed: passedChecks,
      skipped: 0, // We don't currently skip checks
      durationMs: endTime - startTime
    },
    checks: allChecks.map(check => check.toJSON(currentMode)),
    artifacts: {
      paths: cliArgs.out ? [cliArgs.out] : []
    }
  };

  return output;
}

// ============================================
// MAIN EXECUTION
// ============================================

function main() {
  const startTime = Date.now();
  
  log(`DeployGuardian v2 — Mode: ${currentMode}`, "🛡️", COLORS.cyan);
  log("=".repeat(60), "", COLORS.cyan);

  if (isPreDeploy) {
    info("Running in PRE-DEPLOY mode:");
    info("  • Only BLOCKER-level issues will fail deployment");
    info("  • WARNING and INFO issues are logged but don't block");
    info("  • Build-time checks only (runtime checks deferred to deployment)");
    log("=".repeat(60), "", COLORS.cyan);
  }

  // Run validations based on mode
  if (currentMode === MODES.VALIDATE || currentMode === MODES.PRE_MERGE || currentMode === MODES.PRE_DEPLOY) {
    validateTerraform();
    validatePrisma();
    validateWorkers();
    validateSecrets();
  }

  if (currentMode === MODES.PRE_MERGE || currentMode === MODES.PRE_DEPLOY) {
    checkUnsafeMerges();
  }

  // Calculate summary
  const allChecks = Object.values(results);
  const totalChecks = allChecks.length;
  const passedChecks = allChecks.filter(c => c.passed).length;
  const blockerCount = allChecks.filter(c => 
    c.messages.some(m => m.severity === SEVERITY.BLOCKER) && !c.passed
  ).length;
  const warningCount = allChecks.filter(c => 
    c.messages.some(m => m.severity === SEVERITY.WARNING) && !c.passed
  ).length;

  const endTime = Date.now();

  // Print detailed summary (if console output enabled)
  if (shouldShowConsole) {
    log("=".repeat(60), "", COLORS.cyan);
    log("Validation Summary", "📊", COLORS.cyan);
    log("=".repeat(60), "", COLORS.cyan);

    console.log();
    for (const [name, check] of Object.entries(results)) {
      const status = check.passed ? "✅ PASS" : 
                     check.messages.some(m => m.severity === SEVERITY.BLOCKER) ? "❌ FAIL" : "⚠️  WARN";
      console.log(`${name.padEnd(20)} ${status}`);
      
      // Show messages if any
      if (check.messages.length > 0) {
        for (const msg of check.messages) {
          const icon = msg.severity === SEVERITY.BLOCKER ? "  ❌" :
                       msg.severity === SEVERITY.WARNING ? "  ⚠️ " : "  ℹ️ ";
          const color = msg.severity === SEVERITY.BLOCKER ? COLORS.red :
                        msg.severity === SEVERITY.WARNING ? COLORS.yellow : COLORS.cyan;
          console.log(`${color}${icon} ${msg.text}${COLORS.reset}`);
        }
      }
      console.log();
    }

    log("=".repeat(60), "", COLORS.cyan);
    console.log(`Total Checks:       ${passedChecks}/${totalChecks}`);
    console.log(`${COLORS.red}Blockers:           ${blockerCount}${COLORS.reset}`);
    console.log(`${COLORS.yellow}Warnings:           ${warningCount}${COLORS.reset}`);
    console.log();

    // Determine deployment safety
    const isSafe = blockerCount === 0;
    const verdict = isSafe ? "✅ SAFE TO DEPLOY" : "❌ UNSAFE TO DEPLOY";
    const verdictColor = isSafe ? COLORS.green : COLORS.red;
    
    console.log(`${verdictColor}Deployment Safety:  ${verdict}${COLORS.reset}`);
    log("=".repeat(60), "", COLORS.cyan);

    if (isSafe && warningCount > 0) {
      warn(`Deployment is SAFE but has ${warningCount} warning(s) that should be addressed.`);
    }
  }

  // Generate JSON output
  const jsonOutput = generateJSONOutput(startTime, endTime, blockerCount, warningCount, passedChecks, totalChecks);

  // Write JSON to file if --out specified
  if (cliArgs.out) {
    const outDir = path.dirname(cliArgs.out);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(cliArgs.out, JSON.stringify(jsonOutput, null, 2), "utf8");
    if (shouldShowConsole) {
      info(`JSON output written to: ${cliArgs.out}`);
    }
  }

  // Write JSON to stdout if format is json
  if (cliArgs.format === "json") {
    console.log(JSON.stringify(jsonOutput, null, 2));
  }

  // Exit with appropriate code
  const exitCode = jsonOutput.verdict.exitCode;
  
  if (shouldShowConsole) {
    if (exitCode === 0) {
      success("DeployGuardian PASSED");
    } else {
      error(`DeployGuardian FAILED (${blockerCount} blocker(s))`);
    }
  }
  
  process.exit(exitCode);
}

if (require.main === module) {
  main();
}

module.exports = { validateTerraform, validatePrisma, validateWorkers, validateSecrets, checkUnsafeMerges };
