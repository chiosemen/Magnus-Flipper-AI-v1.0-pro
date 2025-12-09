const fs = require("fs");
const path = require("path");

function loadVault() {
  const templatePath = path.join("secrets", "env.vault.local.json");
  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Vault file not found: ${templatePath}. Copy env.vault.template.json -> env.vault.local.json and fill values.`
    );
  }
  const raw = fs.readFileSync(templatePath, "utf8");
  return JSON.parse(raw);
}

function envToDotEnv(values) {
  return Object.entries(values)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

function diffKeys(envA, envB) {
  const keysA = new Set(Object.keys(envA || {}));
  const keysB = new Set(Object.keys(envB || {}));
  const onlyA = [];
  const onlyB = [];
  for (const k of keysA) {
    if (!keysB.has(k)) onlyA.push(k);
  }
  for (const k of keysB) {
    if (!keysA.has(k)) onlyB.push(k);
  }
  return { onlyA, onlyB };
}

function buildGithubCommands(values) {
  // These are the ones we typically store in GitHub secrets
  const keys = [
    "SUPABASE_DB_URL",
    "SUPABASE_STAGING_DB_URL",
    "AZURE_SUBSCRIPTION_ID",
    "AZURE_TENANT_ID",
    "AZURE_CLIENT_ID",
    "AZURE_CLIENT_SECRET",
    "VERCEL_TOKEN",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY"
  ];
  return keys
    .map(k =>
      values[k]
        ? `gh secret set ${k} --body "${values[k]}"`
        : `# Missing in PROD vault: ${k}`
    )
    .join("\n");
}

function buildVercelCommands(values) {
  // For your Vercel project - uses safe edit-if-exists logic
  const keys = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_API_BASE_URL",
    "AI_GATEWAY_API_KEY"
  ];
  
  const environments = ["production", "preview", "development"];
  const commands = [];
  
  for (const key of keys) {
    const value = values[key];
    
    if (!value) {
      commands.push(`# Missing variable: ${key}`);
      continue;
    }
    
    for (const targetEnv of environments) {
      commands.push("");
      commands.push(`echo "🔍 Checking ${key} in ${targetEnv}..."`);
      commands.push(`EXISTS=$(vercel env ls --environment=${targetEnv} | grep -w "${key}" || true)`);
      commands.push(`if [[ -n "$EXISTS" ]]; then`);
      commands.push(`  echo "✏️  Editing existing: ${key} (${targetEnv})"`);
      commands.push(`  printf "%s" "${value}" | vercel env edit ${key} ${targetEnv}`);
      commands.push(`else`);
      commands.push(`  echo "➕ Adding new: ${key} (${targetEnv})"`);
      commands.push(`  printf "%s" "${value}" | vercel env add ${key} ${targetEnv}`);
      commands.push(`fi`);
    }
  }
  
  return commands.join("\n");
}

function buildAzureCommands(values) {
  // This assumes a single worker app; you can tweak name/resource group
  const appName = "flipper-workers";
  const resourceGroup = values["AZURE_RESOURCE_GROUP"] || "magnus-flipper-prod";
  const keys = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
    "REDIS_URL",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY"
  ];
  const secretPairs = keys
    .filter(k => values[k])
    .map(k => `${k}="${values[k]}"`)
    .join(" ");
  if (!secretPairs) {
    return "# No Azure secrets found in vault for this environment.";
  }
  return `az containerapp secret set --name ${appName} --resource-group ${resourceGroup} --secrets ${secretPairs}`;
}

module.exports = async () => {
  const vault = loadVault();
  const envs = vault.environments || {};
  const required = ["local", "staging", "production"];
  
  for (const name of required) {
    if (!envs[name] || !envs[name].values) {
      throw new Error(
        `Environment "${name}" missing or invalid in env.vault.local.json`
      );
    }
  }

  const local = envs.local.values;
  const staging = envs.staging.values;
  const production = envs.production.values;

  // 1) Diff keys
  const diffs = {
    local_vs_staging: diffKeys(local, staging),
    staging_vs_production: diffKeys(staging, production),
    local_vs_production: diffKeys(local, production)
  };

  const statusReport = `# Magnus Env Vault Status

Generated: ${new Date().toISOString()}

## Environments

- **local**: ${Object.keys(local).length} keys
- **staging**: ${Object.keys(staging).length} keys
- **production**: ${Object.keys(production).length} keys

## Key Differences

### local vs staging

- Only in local: ${diffs.local_vs_staging.onlyA.join(", ") || "—"}
- Only in staging: ${diffs.local_vs_staging.onlyB.join(", ") || "—"}

### staging vs production

- Only in staging: ${diffs.staging_vs_production.onlyA.join(", ") || "—"}
- Only in production: ${diffs.staging_vs_production.onlyB.join(", ") || "—"}

### local vs production

- Only in local: ${diffs.local_vs_production.onlyA.join(", ") || "—"}
- Only in production: ${diffs.local_vs_production.onlyB.join(", ") || "—"}

## Notes

- Keep SERVICE_ROLE and DB URLs server-side only (GitHub, Azure, workers).
- NEXT_PUBLIC_* vars are for Vercel / frontend only.
- Passwords in URLs must be URL-encoded for special chars.

`;

  fs.writeFileSync("ENV_VAULT_STATUS.md", statusReport.trim() + "\n");

  // 2) Generate .env files at repo root
  fs.writeFileSync(".env", envToDotEnv(local) + "\n");
  fs.writeFileSync(".env.staging", envToDotEnv(staging) + "\n");
  fs.writeFileSync(".env.production", envToDotEnv(production) + "\n");

  // 3) Generate sync commands (using production as source of truth for cloud)
  const gh = buildGithubCommands(production);
  const vercel = buildVercelCommands(production);
  const azure = buildAzureCommands(production);

  const syncScript = `#!/usr/bin/env bash

set -euo pipefail

# =========================================
# Magnus Env Sync Commands (from PROD vault)
# =========================================
# Generated: ${new Date().toISOString()}
#
# ⚠️  IMPORTANT: Review all commands before executing!
# ⚠️  Some commands may require authentication (gh auth login, vercel login, az login)
#
# Usage:
#   bash ENV_SYNC_COMMANDS.sh           # Run all sections
#   bash ENV_SYNC_COMMANDS.sh --github   # GitHub only
#   bash ENV_SYNC_COMMANDS.sh --vercel  # Vercel only
#   bash ENV_SYNC_COMMANDS.sh --azure   # Azure only
#
# =========================================

run_github() {
  echo ">>> Syncing GitHub Secrets..."
  echo ""
${gh}
}

run_vercel() {
  echo ">>> Syncing Vercel Environment Variables..."
  echo "# Safe Sync System: Automatically uses 'edit' if variable exists, otherwise uses 'add'"
  echo "# Prerequisites: vercel login"
  echo ""
${vercel}
}

run_azure() {
  echo ">>> Syncing Azure Container Apps Secrets..."
  echo ""
${azure}
}

case "$1" in
  --github)
    run_github
    ;;
  --vercel)
    run_vercel
    ;;
  --azure)
    run_azure
    ;;
  "")
    # No argument - run all
    run_github
    echo ""
    run_vercel
    echo ""
    run_azure
    echo ""
    echo "✅ Done. Review commands above and run them manually where appropriate."
    ;;
  *)
    echo "Usage: bash ENV_SYNC_COMMANDS.sh [--github|--vercel|--azure]"
    exit 1
    ;;
esac
`;

  fs.writeFileSync("ENV_SYNC_COMMANDS.sh", syncScript);
  fs.chmodSync("ENV_SYNC_COMMANDS.sh", 0o755);

  return {
    message:
      "✅ Env Vault processed. Generated ENV_VAULT_STATUS.md, .env*, and ENV_SYNC_COMMANDS.sh. Review before running.",
    summary: {
      localKeys: Object.keys(local).length,
      stagingKeys: Object.keys(staging).length,
      productionKeys: Object.keys(production).length,
      diffs: {
        localVsStaging: diffs.local_vs_staging.onlyA.length + diffs.local_vs_staging.onlyB.length,
        stagingVsProduction: diffs.staging_vs_production.onlyA.length + diffs.staging_vs_production.onlyB.length,
        localVsProduction: diffs.local_vs_production.onlyA.length + diffs.local_vs_production.onlyB.length
      }
    }
  };
};

// Allow direct execution
if (require.main === module) {
  module.exports().then(result => {
    console.log(result.message);
    console.log("\n📊 Summary:");
    console.log(`  - Local keys: ${result.summary.localKeys}`);
    console.log(`  - Staging keys: ${result.summary.stagingKeys}`);
    console.log(`  - Production keys: ${result.summary.productionKeys}`);
    console.log(`  - Key differences found: ${result.summary.diffs.localVsStaging + result.summary.diffs.stagingVsProduction + result.summary.diffs.localVsProduction}`);
    console.log("\n📄 Generated files:");
    console.log("  - ENV_VAULT_STATUS.md");
    console.log("  - .env");
    console.log("  - .env.staging");
    console.log("  - .env.production");
    console.log("  - ENV_SYNC_COMMANDS.sh");
  }).catch(err => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
}
