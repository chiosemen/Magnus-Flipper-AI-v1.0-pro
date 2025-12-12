#!/usr/bin/env node
if (process.env.CI_DEPLOY_GUARDIAN_DISABLED === "true") {
  console.warn("⚠️ DeployGuardian disabled via CI_DEPLOY_GUARDIAN_DISABLED");
  process.exit(0);
}
/**
 * DeployGuardian v1 — CI/CD Validation & Deployment Hardening
 * -----------------------------------------------------------
 * Validates all PRs and deployment flows for production readiness:
 * 
 * 1. Terraform validation
 * 2. Prisma readiness checks
 * 3. Worker build checks
 * 4. Secrets + environment validation
 * 5. Block unsafe merges
 * 6. Patch CI/CD workflows
 * 
 * Usage:
 *   node tools/deploy_guardian.js --mode=validate
 *   node tools/deploy_guardian.js --mode=pre-merge
 *   node tools/deploy_guardian.js --mode=pre-deploy
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const MODES = {
  VALIDATE: "validate",
  PRE_MERGE: "pre-merge",
  PRE_DEPLOY: "pre-deploy",
};

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(msg, emoji = "✨", color = COLORS.reset) {
  console.log(`${color}${emoji} ${msg}${COLORS.reset}`);
}

function error(msg) {
  log(msg, "❌", COLORS.red);
}

function success(msg) {
  log(msg, "✅", COLORS.green);
}

function warn(msg) {
  log(msg, "⚠️", COLORS.yellow);
}

function info(msg) {
  log(msg, "ℹ️", COLORS.cyan);
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

// Validation results
const results = {
  terraform: { valid: false, errors: [] },
  prisma: { ready: false, errors: [] },
  workers: { built: false, errors: [] },
  secrets: { complete: false, missing: [] },
  unsafe: { blocked: false, reasons: [] },
  summary: { passed: false, totalChecks: 0, passedChecks: 0 },
};

// ============================================
// 1. TERRAFORM VALIDATION
// ============================================

function validateTerraform() {
  log("Validating Terraform configuration...", "🏗️");
  results.terraform.totalChecks = 3;

  const terraformDir = path.join(__dirname, "../infra/azure");
  if (!fs.existsSync(terraformDir)) {
    results.terraform.errors.push("Terraform directory not found");
    return;
  }

  // Check if terraform is installed
  const tfCheck = run("terraform version", { silent: true });
  if (!tfCheck.ok) {
    results.terraform.errors.push("Terraform not installed or not in PATH");
    return;
  }

  // Run terraform init
  const initResult = run(`cd ${terraformDir} && terraform init -input=false`, {
    silent: true,
  });
  if (!initResult.ok) {
    results.terraform.errors.push(`Terraform init failed: ${initResult.error}`);
    return;
  }
  results.terraform.totalChecks--;

  // Run terraform validate
  const validateResult = run(`cd ${terraformDir} && terraform validate`, {
    silent: true,
  });
  if (!validateResult.ok) {
    results.terraform.errors.push(`Terraform validate failed: ${validateResult.output}`);
    return;
  }
  results.terraform.totalChecks--;

  // Run terraform plan (dry-run)
  const planResult = run(`cd ${terraformDir} && terraform plan -out=/dev/null`, {
    silent: true,
  });
  if (!planResult.ok) {
    results.terraform.errors.push(`Terraform plan failed: ${planResult.output}`);
    return;
  }
  results.terraform.totalChecks--;

  if (results.terraform.errors.length === 0) {
    results.terraform.valid = true;
    success("Terraform validation passed");
  } else {
    error(`Terraform validation failed: ${results.terraform.errors.join(", ")}`);
  }
}

// ============================================
// 2. PRISMA READINESS CHECKS (with Client Freshness)
// ============================================

function validatePrisma() {
  log("Validating Prisma readiness and client freshness...", "🧬");
  results.prisma.totalChecks = 5;

  const prismaSchema = path.join(__dirname, "../packages/core/prisma/schema.prisma");
  if (!fs.existsSync(prismaSchema)) {
    results.prisma.errors.push("Prisma schema not found");
    return;
  }

  // Check schema syntax
  const schemaCheck = run(
    `cd ${path.dirname(prismaSchema)} && npx prisma validate`,
    { silent: true }
  );
  if (!schemaCheck.ok) {
    results.prisma.errors.push(`Schema validation failed: ${schemaCheck.output}`);
    return;
  }
  results.prisma.totalChecks--;

  // Check Prisma client freshness
  const schemaStats = fs.statSync(prismaSchema);
  const schemaModified = schemaStats.mtime.getTime();
  
  const clientPath = path.join(__dirname, "../packages/core/node_modules/.prisma/client/index.js");
  let clientFresh = false;
  
  if (fs.existsSync(clientPath)) {
    const clientStats = fs.statSync(clientPath);
    const clientModified = clientStats.mtime.getTime();
    
    // Client is fresh if it was generated after schema was last modified
    // Allow 5 second tolerance for file system timing
    clientFresh = clientModified >= schemaModified - 5000;
    
    if (!clientFresh) {
      results.prisma.errors.push(
        `Prisma client is stale (schema modified: ${new Date(schemaModified).toISOString()}, client: ${new Date(clientModified).toISOString()})`
      );
    }
  } else {
    results.prisma.errors.push("Prisma client not found - needs generation");
    clientFresh = false;
  }
  results.prisma.totalChecks--;

  // Force regenerate client to ensure freshness
  log("Regenerating Prisma client to ensure freshness...", "🔄");
  const generateCheck = run(
    `cd ${path.dirname(prismaSchema)} && npx prisma generate --schema=./schema.prisma`,
    { silent: true }
  );
  if (!generateCheck.ok) {
    results.prisma.errors.push(`Prisma generate failed: ${generateCheck.output}`);
    return;
  }
  results.prisma.totalChecks--;

  // Verify client was generated successfully
  if (!fs.existsSync(clientPath)) {
    results.prisma.errors.push("Prisma client generation failed - client file not found");
    return;
  }
  results.prisma.totalChecks--;

  // Check for migration files
  const migrationsDir = path.join(__dirname, "../supabase/migrations");
  if (!fs.existsSync(migrationsDir)) {
    results.prisma.errors.push("Migrations directory not found");
    return;
  }
  results.prisma.totalChecks--;

  // Check for dangerous migrations (DROP, DELETE, TRUNCATE)
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"));
  
  let hasDangerous = false;
  for (const file of migrationFiles) {
    const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    if (/DROP\s+(TABLE|COLUMN|INDEX|DATABASE)/i.test(content)) {
      hasDangerous = true;
      results.prisma.errors.push(`Dangerous migration detected: ${file}`);
    }
  }

  if (results.prisma.errors.length === 0) {
    results.prisma.ready = true;
    success("Prisma readiness check passed (client is fresh)");
  } else {
    error(`Prisma readiness check failed: ${results.prisma.errors.join(", ")}`);
  }
}

// ============================================
// 3. WORKER IMAGE BUILD CHECKS
// ============================================

function validateWorkers() {
  log("Validating worker image builds...", "🐳");
  results.workers.totalChecks = 5;

  const workers = [
    "worker-realtime",
    "worker-scheduler",
    "worker-alerts",
  ];

  // Check Docker is available
  const dockerCheck = run("docker --version", { silent: true });
  if (!dockerCheck.ok) {
    results.workers.errors.push("Docker not available - cannot validate image builds");
    return;
  }
  results.workers.totalChecks--;

  for (const worker of workers) {
    const workerPath = path.join(__dirname, `../apps/${worker}`);
    if (!fs.existsSync(workerPath)) {
      results.workers.errors.push(`Worker not found: ${worker}`);
      continue;
    }

    // Check Dockerfile exists
    const dockerfile = path.join(workerPath, "Dockerfile");
    if (!fs.existsSync(dockerfile)) {
      results.workers.errors.push(`Dockerfile not found: ${worker}`);
      continue;
    }

    // Check Dockerfile for NO-BUILD pattern
    const dockerfileContent = fs.readFileSync(dockerfile, "utf8");
    if (/RUN.*(pnpm build|tsc|npm run build)/.test(dockerfileContent)) {
      results.workers.errors.push(
        `${worker}: Dockerfile contains build commands (should use NO-BUILD pattern)`
      );
    }

    // Validate Dockerfile syntax
    const dockerfileValidate = run(
      `docker build --platform linux/amd64 --dry-run -f ${dockerfile} .`,
      { silent: true, cwd: path.join(__dirname, "..") }
    );
    if (!dockerfileValidate.ok) {
      // Try actual build instead (dry-run not always available)
      log(`Building ${worker} image for validation...`, "🔨");
      const dockerBuild = run(
        `docker build --platform linux/amd64 -t magnus-${worker}:test -f ${dockerfile} .`,
        { silent: true, cwd: path.join(__dirname, "..") }
      );
      if (!dockerBuild.ok) {
        results.workers.errors.push(`${worker}: Docker image build failed`);
      } else {
        // Clean up test image
        run(`docker rmi magnus-${worker}:test`, { silent: true });
      }
    }
  }
  results.workers.totalChecks--;

  // Try to build workers TypeScript (validation)
  log("Validating worker TypeScript builds...", "📦");
  for (const worker of workers) {
    const buildCheck = run(`pnpm --filter ${worker} build`, {
      silent: true,
      cwd: path.join(__dirname, ".."),
    });
    if (!buildCheck.ok) {
      results.workers.errors.push(`${worker}: TypeScript build failed`);
    }
  }
  results.workers.totalChecks--;

  // Check worker package.json files
  for (const worker of workers) {
    const packageJson = path.join(__dirname, `../apps/${worker}/package.json`);
    if (!fs.existsSync(packageJson)) {
      results.workers.errors.push(`package.json not found: ${worker}`);
    } else {
      const pkg = JSON.parse(fs.readFileSync(packageJson, "utf8"));
      if (!pkg.scripts || !pkg.scripts.start) {
        results.workers.errors.push(`${worker}: Missing start script`);
      }
    }
  }
  results.workers.totalChecks--;

  if (results.workers.errors.length === 0) {
    results.workers.built = true;
    success("Worker image build checks passed");
  } else {
    error(`Worker image build checks failed: ${results.workers.errors.join(", ")}`);
  }
}

// ============================================
// 4. ENVIRONMENT VARIABLES VALIDATION
// ============================================

function validateSecrets() {
  log("Validating environment variables...", "🔐");
  results.secrets.totalChecks = 4;

  // Required for all environments
  const requiredSecrets = [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
  ];

  // Required for Azure deployment
  const azureSecrets = [
    "AZURE_CLIENT_ID",
    "AZURE_TENANT_ID",
    "AZURE_SUBSCRIPTION_ID",
    "AZURE_ACR_NAME",
  ];

  // Required for Vercel deployment
  const vercelSecrets = [
    "VERCEL_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
  ];

  const missing = [];
  const missingAzure = [];
  const missingVercel = [];

  // Check core secrets
  for (const secret of requiredSecrets) {
    const value = process.env[secret] || process.env[`GITHUB_SECRET_${secret}`];
    if (!value) {
      missing.push(secret);
    } else {
      // Validate format
      if (secret === "DATABASE_URL" && !value.startsWith("postgresql://")) {
        results.secrets.errors.push(`DATABASE_URL format invalid (should start with postgresql://)`);
      }
      if (secret === "SUPABASE_URL" && !value.startsWith("https://")) {
        results.secrets.errors.push(`SUPABASE_URL format invalid (should be HTTPS URL)`);
      }
    }
  }
  results.secrets.totalChecks--;

  // Check Azure secrets (if deploying to Azure)
  const isAzureDeploy = process.env.DEPLOY_ENV === "production" || process.env.AZURE_CLIENT_ID;
  if (isAzureDeploy) {
    for (const secret of azureSecrets) {
      const value = process.env[secret] || process.env[`GITHUB_SECRET_${secret}`];
      if (!value) {
        missingAzure.push(secret);
      }
    }
    if (missingAzure.length > 0) {
      missing.push(...missingAzure);
      results.secrets.errors.push(`Missing Azure secrets: ${missingAzure.join(", ")}`);
    }
  }
  results.secrets.totalChecks--;

  // Check Vercel secrets (if deploying to Vercel)
  const isVercelDeploy = process.env.VERCEL_TOKEN || process.env.VERCEL_PROJECT_ID;
  if (isVercelDeploy) {
    for (const secret of vercelSecrets) {
      const value = process.env[secret] || process.env[`GITHUB_SECRET_${secret}`];
      if (!value) {
        missingVercel.push(secret);
      }
    }
    if (missingVercel.length > 0) {
      missing.push(...missingVercel);
      results.secrets.errors.push(`Missing Vercel secrets: ${missingVercel.join(", ")}`);
    }
  }
  results.secrets.totalChecks--;

  // Check environment template
  const envTemplate = path.join(__dirname, "../env.local.template");
  if (fs.existsSync(envTemplate)) {
    const templateContent = fs.readFileSync(envTemplate, "utf8");
    const templateSecrets = templateContent.match(/^[A-Z_]+=/gm) || [];
    info(`Environment template found with ${templateSecrets.length} variables`);
    
    // Validate template completeness
    const templateVars = templateSecrets.map((s) => s.replace("=", ""));
    const missingInTemplate = requiredSecrets.filter((s) => !templateVars.includes(s));
    if (missingInTemplate.length > 0) {
      results.secrets.errors.push(`Template missing variables: ${missingInTemplate.join(", ")}`);
    }
  } else {
    warn("Environment template not found");
  }
  results.secrets.totalChecks--;

  if (missing.length > 0) {
    results.secrets.missing = missing;
    error(`Missing required environment variables: ${missing.join(", ")}`);
  } else if (results.secrets.errors.length > 0) {
    error(`Environment variable validation failed: ${results.secrets.errors.join(", ")}`);
  } else {
    results.secrets.complete = true;
    success(`Environment variables validation passed (${requiredSecrets.length} core, ${isAzureDeploy ? azureSecrets.length : 0} Azure, ${isVercelDeploy ? vercelSecrets.length : 0} Vercel)`);
  }
}

// ============================================
// 5. UNSAFE MERGE BLOCKING
// ============================================

function checkUnsafeMerges() {
  log("Checking for unsafe merge conditions...", "🛡️");
  results.unsafe.totalChecks = 5;

  // Check for uncommitted changes
  const gitStatus = run("git status --porcelain", { silent: true });
  if (gitStatus.ok && gitStatus.output.trim().length > 0) {
    results.unsafe.reasons.push("Uncommitted changes detected");
  }
  results.unsafe.totalChecks--;

  // Check for WIP commits
  const lastCommit = run("git log -1 --pretty=%B", { silent: true });
  if (lastCommit.ok && /WIP|wip|draft/i.test(lastCommit.output)) {
    results.unsafe.reasons.push("WIP commit detected in HEAD");
  }
  results.unsafe.totalChecks--;

  // Check for force push markers
  const recentCommits = run("git log --oneline -10", { silent: true });
  if (recentCommits.ok && /force|reset|rebase/i.test(recentCommits.output)) {
    results.unsafe.reasons.push("Force push detected in recent history");
  }
  results.unsafe.totalChecks--;

  // Check for broken tests
  const testCheck = run("pnpm test --passWithNoTests", { silent: true });
  if (!testCheck.ok) {
    results.unsafe.reasons.push("Tests are failing");
  }
  results.unsafe.totalChecks--;

  // Check for lint errors
  const lintCheck = run("pnpm lint", { silent: true });
  if (!lintCheck.ok) {
    results.unsafe.reasons.push("Lint errors detected");
  }
  results.unsafe.totalChecks--;

  if (results.unsafe.reasons.length > 0) {
    results.unsafe.blocked = true;
    error(`Unsafe merge conditions detected: ${results.unsafe.reasons.join(", ")}`);
  } else {
    success("No unsafe merge conditions detected");
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find((a) => a.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : MODES.VALIDATE;

  log(`DeployGuardian v1 — Mode: ${mode}`, "🛡️", COLORS.cyan);
  log("=".repeat(60), "", COLORS.cyan);

  // Run validations based on mode
  if (mode === MODES.VALIDATE || mode === MODES.PRE_MERGE || mode === MODES.PRE_DEPLOY) {
    validateTerraform();
    validatePrisma();
    validateWorkers();
    validateSecrets();
  }

  if (mode === MODES.PRE_MERGE || mode === MODES.PRE_DEPLOY) {
    checkUnsafeMerges();
  }

  // Calculate summary
  results.summary.totalChecks =
    (results.terraform.totalChecks || 0) +
    (results.prisma.totalChecks || 0) +
    (results.workers.totalChecks || 0) +
    (results.secrets.totalChecks || 0) +
    (results.unsafe.totalChecks || 0);

  results.summary.passedChecks =
    (results.terraform.valid ? results.terraform.totalChecks : 0) +
    (results.prisma.ready ? results.prisma.totalChecks : 0) +
    (results.workers.built ? results.workers.totalChecks : 0) +
    (results.secrets.complete ? results.secrets.totalChecks : 0) +
    (results.unsafe.blocked ? 0 : (results.unsafe.totalChecks || 0));

  results.summary.passed =
    results.terraform.valid &&
    results.prisma.ready &&
    results.workers.built &&
    results.secrets.complete &&
    !results.unsafe.blocked;

  // Print summary
  log("=".repeat(60), "", COLORS.cyan);
  log("Validation Summary", "📊", COLORS.cyan);
  log("=".repeat(60), "", COLORS.cyan);

  console.log(`
Terraform:     ${results.terraform.valid ? "✅ PASS" : "❌ FAIL"}
Prisma:        ${results.prisma.ready ? "✅ PASS" : "❌ FAIL"}
Workers:       ${results.workers.built ? "✅ PASS" : "❌ FAIL"}
Secrets:       ${results.secrets.complete ? "✅ PASS" : "❌ FAIL"}
Unsafe Merge:  ${results.unsafe.blocked ? "❌ BLOCKED" : "✅ SAFE"}

Total Checks:  ${results.summary.passedChecks}/${results.summary.totalChecks}
Overall:       ${results.summary.passed ? "✅ PASS" : "❌ FAIL"}
`);

  // Exit with appropriate code
  process.exit(results.summary.passed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { validateTerraform, validatePrisma, validateWorkers, validateSecrets, checkUnsafeMerges };
