#!/usr/bin/env node

/**
 * Terraform Drift Surgeon v1 — Automatic Drift Patch Assistant
 * -------------------------------------------
 * Detects Terraform drift and common module/resource conflicts,
 * then generates terraform import / taint / state commands to realign
 * state with Azure. Can optionally auto-apply drift fixes when requested.
 * 
 * Modes:
 *   - orchestrate (default): Full init → validate → plan → drift detection → fix → apply
 *   - plan: Only run plan and detect drift (no apply)
 *   - auto-fix: Apply drift fixes automatically (gated by AUTO_APPLY_TERRAFORM_DRIFT)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function log(msg, emoji = "✨") {
  console.log(`\n${emoji} ${msg}\n`);
}

function run(cmd, options = {}) {
  console.log(`\n▶️  ${cmd}`);
  try {
    const out = execSync(cmd, { stdio: "inherit", encoding: "utf8", ...options });
    return { ok: true, out: out.trim() };
  } catch (err) {
    const stdout = err.stdout?.toString() || "";
    const stderr = err.stderr?.toString() || "";
    return { ok: false, err: err.message, stdout, stderr, code: err.status || err.code };
  }
}

function runCapture(cmd, options = {}) {
  try {
    const out = execSync(cmd, { encoding: "utf8", stdio: "pipe", ...options });
    return { ok: true, out: out.trim() };
  } catch (err) {
    const stdout = err.stdout?.toString() || "";
    const stderr = err.stderr?.toString() || "";
    return { ok: false, err: err.message, stdout, stderr, code: err.status || err.code };
  }
}

// Parse command line args
const args = process.argv.slice(2);
const mode = args.find(a => a.startsWith("--mode="))?.split("=")[1] || "orchestrate";

// Constants
const TERRAFORM_DIR = path.resolve("infra/azure");
const DRIFT_FIXES_FILE = path.resolve("TERRAFORM_DRIFT_FIXES.md");
const AUTO_APPLY = process.env.AUTO_APPLY_TERRAFORM_DRIFT === "true";

// ============================================
// Step 1 — Pre-flight
// ============================================

function step1_preflight() {
  log("STEP 1: Pre-flight Checks", "🔍");
  
  if (!fs.existsSync(TERRAFORM_DIR)) {
    throw new Error(`Terraform directory not found: ${TERRAFORM_DIR}`);
  }
  
  log("Running terraform init...", "🧱");
  const initRes = run("terraform init -input=false -upgrade", { cwd: TERRAFORM_DIR });
  if (!initRes.ok) {
    return { status: "error", stage: "init", message: "terraform init failed" };
  }
  
  log("Running terraform validate...", "✅");
  const validateRes = run("terraform validate", { cwd: TERRAFORM_DIR });
  if (!validateRes.ok) {
    return { status: "error", stage: "validate", message: "terraform validate failed" };
  }
  
  return { status: "ok" };
}

// ============================================
// Step 2 — Plan with Detailed Exit Code
// ============================================

function step2_plan() {
  log("STEP 2: Terraform Plan (with detailed exit code)", "📐");
  
  const planRes = runCapture(
    "terraform plan -out=tfplan-workers -detailed-exitcode",
    { cwd: TERRAFORM_DIR }
  );
  
  const exitCode = planRes.code || 0;
  const output = planRes.stdout || planRes.stderr || "";
  
  // Terraform plan exit codes:
  // 0 = no changes
  // 1 = error
  // 2 = changes/drift detected
  
  if (exitCode === 0) {
    log("✅ No changes detected. State is in sync.", "✅");
    return { status: "ok", exitCode: 0, output };
  } else if (exitCode === 2) {
    log("⚠️  Changes/drift detected", "⚠️");
    return { status: "drift", exitCode: 2, output };
  } else {
    log("❌ Terraform plan error", "❌");
    return { status: "error", exitCode: 1, output };
  }
}

// ============================================
// Step 3 — Drift Parsing
// ============================================

function step3_parseDrift(planOutput) {
  log("STEP 3: Parsing Drift", "🔍");
  
  const suggestions = [];
  const patterns = [
    {
      regex: /must be imported into the state before.*?resource "([^"]+)" "([^"]+)"/g,
      type: "import",
      extract: (match) => {
        const resourceType = match[1];
        const resourceName = match[2];
        return { resourceType, resourceName, action: "import" };
      }
    },
    {
      regex: /already exists.*?resource "([^"]+)" "([^"]+)"/g,
      type: "import",
      extract: (match) => {
        const resourceType = match[1];
        const resourceName = match[2];
        return { resourceType, resourceName, action: "import" };
      }
    },
    {
      regex: /Resource.*?already managed by Terraform.*?resource "([^"]+)" "([^"]+)"/g,
      type: "import",
      extract: (match) => {
        const resourceType = match[1];
        const resourceName = match[2];
        return { resourceType, resourceName, action: "import" };
      }
    }
  ];
  
  // Extract resource addresses from plan output
  const resourceMatches = planOutput.match(/^[\s]*#\s*([a-z_]+\.[a-z_]+)\s*will be created/gm);
  if (resourceMatches) {
    resourceMatches.forEach(match => {
      const resourceAddr = match.match(/#\s*([a-z_]+\.[a-z_]+)/)?.[1];
      if (resourceAddr) {
        // Try to infer Azure resource ID
        const parts = resourceAddr.split(".");
        if (parts.length === 2) {
          const [resourceType, resourceName] = parts;
          
          // Map Terraform resource types to Azure resource types
          const azureResourceMap = {
            "azurerm_container_app": {
              realtime: "/subscriptions/{sub}/resourceGroups/magnus-rg/providers/Microsoft.App/containerApps/mf-worker-realtime",
              scheduler: "/subscriptions/{sub}/resourceGroups/magnus-rg/providers/Microsoft.App/containerApps/mf-worker-scheduler"
            }
          };
          
          if (resourceType === "azurerm_container_app") {
            const azureId = azureResourceMap[resourceType][resourceName] || 
                          `/subscriptions/{sub}/resourceGroups/magnus-rg/providers/Microsoft.App/containerApps/${resourceName}`;
            
            suggestions.push({
              resourceType,
              resourceName,
              action: "import",
              terraformAddress: resourceAddr,
              azureId: azureId.replace("{sub}", getSubscriptionId())
            });
          }
        }
      }
    });
  }
  
  // Also try to extract from error messages
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(planOutput)) !== null) {
      const extracted = pattern.extract(match);
      if (extracted && !suggestions.find(s => 
        s.resourceType === extracted.resourceType && 
        s.resourceName === extracted.resourceName
      )) {
        suggestions.push({
          ...extracted,
          terraformAddress: `${extracted.resourceType}.${extracted.resourceName}`,
          azureId: inferAzureId(extracted.resourceType, extracted.resourceName)
        });
      }
    }
  });
  
  return suggestions;
}

function getSubscriptionId() {
  try {
    const res = runCapture("az account show --query id -o tsv");
    return res.ok && res.out ? res.out.trim() : "{subscription-id}";
  } catch {
    return "{subscription-id}";
  }
}

function inferAzureId(resourceType, resourceName) {
  const subId = getSubscriptionId();
  
  if (resourceType === "azurerm_container_app") {
    return `/subscriptions/${subId}/resourceGroups/magnus-rg/providers/Microsoft.App/containerApps/${resourceName}`;
  }
  
  // Generic fallback
  return `/subscriptions/${subId}/resourceGroups/magnus-rg/providers/Microsoft.App/containerApps/${resourceName}`;
}

// ============================================
// Step 4 — Auto-Fix Logic (Gated)
// ============================================

function step4_autoFix(suggestions) {
  log("STEP 4: Auto-Fix Logic", "🔧");
  
  if (suggestions.length === 0) {
    log("No drift fixes needed", "✅");
    return { status: "ok", applied: [] };
  }
  
  // Generate fixes file
  log("Generating TERRAFORM_DRIFT_FIXES.md...", "📝");
  let fixesContent = `# Terraform Drift Fixes\n\n`;
  fixesContent += `Generated by TerraformDriftSurgeon v1\n`;
  fixesContent += `Date: ${new Date().toISOString()}\n\n`;
  fixesContent += `## Summary\n\n`;
  fixesContent += `Detected ${suggestions.length} resource(s) that need to be imported into Terraform state.\n\n`;
  fixesContent += `## Suggested Commands\n\n`;
  
  suggestions.forEach((suggestion, idx) => {
    fixesContent += `### ${idx + 1}. Import ${suggestion.terraformAddress}\n\n`;
    fixesContent += `\`\`\`bash\n`;
    fixesContent += `cd infra/azure\n`;
    fixesContent += `terraform import ${suggestion.terraformAddress} "${suggestion.azureId}"\n`;
    fixesContent += `\`\`\`\n\n`;
  });
  
  fixesContent += `## After Applying Fixes\n\n`;
  fixesContent += `1. Re-run: \`node tools/terraform_drift_surgeon_v1.js --mode=orchestrate\`\n`;
  fixesContent += `2. Or manually: \`cd infra/azure && terraform plan\`\n\n`;
  
  fs.writeFileSync(DRIFT_FIXES_FILE, fixesContent);
  log(`✅ Fixes written to ${DRIFT_FIXES_FILE}`, "✅");
  
  if (!AUTO_APPLY) {
    log("AUTO_APPLY_TERRAFORM_DRIFT is not set to 'true'. Skipping auto-apply.", "ℹ️");
    log("Review TERRAFORM_DRIFT_FIXES.md and apply fixes manually, or set AUTO_APPLY_TERRAFORM_DRIFT=true", "ℹ️");
    return { 
      status: "drift-detected", 
      fixesFile: DRIFT_FIXES_FILE,
      suggestions 
    };
  }
  
  // Auto-apply fixes
  log("AUTO_APPLY_TERRAFORM_DRIFT=true. Applying fixes...", "🚀");
  const applied = [];
  
  for (const suggestion of suggestions) {
    log(`Importing ${suggestion.terraformAddress}...`, "🔧");
    const importRes = run(
      `terraform import ${suggestion.terraformAddress} "${suggestion.azureId}"`,
      { cwd: TERRAFORM_DIR }
    );
    
    if (importRes.ok) {
      applied.push(suggestion);
      log(`✅ Imported ${suggestion.terraformAddress}`, "✅");
    } else {
      console.warn(`⚠️  Failed to import ${suggestion.terraformAddress}`);
    }
  }
  
  if (applied.length === 0) {
    return { status: "error", message: "Failed to apply any drift fixes" };
  }
  
  // Re-run plan to verify
  log("Re-running plan to verify fixes...", "🔍");
  const verifyRes = step2_plan();
  
  if (verifyRes.status === "ok") {
    log("✅ Drift fixed! State is now in sync.", "✅");
    return { status: "drift-fixed", applied };
  } else {
    log("⚠️  Drift persists after fixes. Additional manual intervention may be needed.", "⚠️");
    return { status: "drift-persist", applied, remaining: verifyRes.output };
  }
}

// ============================================
// Step 5 — Terraform Apply (for orchestrate mode)
// ============================================

function step5_terraformApply() {
  log("STEP 5: Terraform Apply", "🚀");
  
  // Check if plan file exists
  const planFile = path.join(TERRAFORM_DIR, "tfplan-workers");
  if (!fs.existsSync(planFile)) {
    log("No plan file found. Running plan first...", "📐");
    const planRes = step2_plan();
    if (planRes.status !== "ok" && planRes.status !== "drift") {
      throw new Error("Plan failed before apply");
    }
  }
  
  log("Applying Terraform plan...", "🚀");
  const applyRes = run("terraform apply -auto-approve tfplan-workers", { cwd: TERRAFORM_DIR });
  
  if (!applyRes.ok) {
    return { status: "error", message: "terraform apply failed" };
  }
  
  log("✅ Terraform apply successful", "✅");
  return { status: "ok" };
}

// ============================================
// Main Orchestration
// ============================================

async function main() {
  try {
    console.log("=".repeat(50));
    console.log("  Terraform Drift Surgeon v1");
    console.log("  Automatic Drift Patch Assistant");
    console.log("=".repeat(50) + "\n");
    console.log(`Mode: ${mode}`);
    console.log(`Auto-apply: ${AUTO_APPLY ? "enabled" : "disabled"}\n`);
    
    // Step 1: Pre-flight
    const preflight = step1_preflight();
    if (preflight.status === "error") {
      return { status: "error", stage: preflight.stage, message: preflight.message };
    }
    
    // Step 2: Plan
    const plan = step2_plan();
    if (plan.status === "ok") {
      // No drift, proceed to apply if in orchestrate mode
      if (mode === "orchestrate") {
        const apply = step5_terraformApply();
        return apply;
      }
      return { status: "ok" };
    }
    
    if (plan.status === "error") {
      return { status: "error", message: "terraform plan failed", output: plan.output };
    }
    
    // Step 3: Parse drift
    const suggestions = step3_parseDrift(plan.output);
    
    if (suggestions.length === 0 && plan.status === "drift") {
      // Drift detected but couldn't parse specific fixes
      log("⚠️  Drift detected but couldn't parse specific fixes. Manual review needed.", "⚠️");
      return { status: "drift-detected", message: "Manual review needed", output: plan.output };
    }
    
    // Step 4: Auto-fix
    const fixResult = step4_autoFix(suggestions);
    
    if (fixResult.status === "drift-detected") {
      // Fixes generated but not applied
      console.log("\n" + "=".repeat(50));
      console.log("DRIFT DETECTED — FIXES GENERATED");
      console.log("=".repeat(50));
      console.log(`\nReview and apply fixes from: ${DRIFT_FIXES_FILE}`);
      console.log("\nOr set AUTO_APPLY_TERRAFORM_DRIFT=true and re-run.\n");
      return fixResult;
    }
    
    if (fixResult.status === "drift-fixed" || fixResult.status === "ok") {
      // Fixes applied, proceed to apply if in orchestrate mode
      if (mode === "orchestrate") {
        const apply = step5_terraformApply();
        return apply;
      }
      return fixResult;
    }
    
    if (fixResult.status === "drift-persist") {
      return { 
        status: "drift-persist", 
        message: "Drift persists after fixes",
        output: fixResult.remaining 
      };
    }
    
    // If we get here, something unexpected happened
    return { status: "error", message: "Unexpected state" };
    
  } catch (err) {
    console.error("\n❌ Terraform Drift Surgeon v1 failed.");
    console.error(err.message || err);
    return { status: "error", message: err.message };
  }
}

// Export for use as module
if (require.main === module) {
  main().then(result => {
    if (result && result.status) {
      console.log(`\nFinal status: ${result.status}`);
      // Print status in a way that v5 can parse
      console.log(`status: "${result.status}"`);
      process.exit(result.status === "ok" || result.status === "drift-fixed" ? 0 : 1);
    } else {
      console.log(`status: "ok"`);
      process.exit(0);
    }
  }).catch(err => {
    console.error(err);
    console.log(`status: "error"`);
    process.exit(1);
  });
} else {
  module.exports = { main };
}
