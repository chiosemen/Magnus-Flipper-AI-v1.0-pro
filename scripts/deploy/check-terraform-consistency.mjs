#!/usr/bin/env node
/**
 * Magnus Flipper AI — Terraform / GitHub Secrets Consistency Checker
 *
 * Usage:
 *   node scripts/deploy/check-terraform-consistency.mjs chiosemen/Magnus-Flipper-AI-v1.0-pro
 *
 * Requires:
 *   - Node 20+
 *   - gh CLI installed & authenticated
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const repo = process.argv[2];
if (!repo) {
  console.error("Usage: node scripts/deploy/check-terraform-consistency.mjs <github-owner/repo>");
  process.exit(1);
}

const TFVARS_PATH = path.join("infra", "azure", "terraform.tfvars");

const REQUIRED_TF_VARS = [
  "subscription_id",
  "location",
  "resource_group_name",
  "acr_name",
  "containerapps_env_name",
  "database_url",
  "supabase_url",
  "supabase_anon_key",
  "supabase_service_role_key",
  "jwt_secret",
  "stripe_secret_key",
  "stripe_webhook_secret",
  "openai_key",
  "app_url",
  "node_env",
  "demo_mode",
  "log_level",
  "image_tag",
];

const TFVAR_TO_SECRET = {
  subscription_id: "AZURE_SUBSCRIPTION_ID",
  database_url: "DATABASE_URL",
  supabase_url: "SUPABASE_URL",
  supabase_anon_key: "SUPABASE_ANON_KEY",
  supabase_service_role_key: "SUPABASE_SERVICE_ROLE_KEY",
  jwt_secret: "JWT_SECRET",
  stripe_secret_key: "STRIPE_SECRET_KEY",
  stripe_webhook_secret: "STRIPE_WEBHOOK_SECRET",
  openai_key: "OPENAI_API_KEY",
  app_url: "APP_URL",
};

function parseTfvars(content) {
  const lines = content.split(/\r?\n/);
  const map = {};
  for (const line of lines) {
    const m = line.match(/^\s*([a-zA-Z0-9_]+)\s*=\s*"(.*)"\s*$/);
    if (m) {
      const [, key, value] = m;
      map[key] = value;
    }
  }
  return map;
}

function getGitHubSecrets(repo) {
  try {
    const out = execSync(`gh secret list --repo "${repo}" --app actions`, {
      encoding: "utf8",
    });
    const secrets = new Set();
    for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      if (parts[0]) secrets.add(parts[0]);
    }
    return secrets;
  } catch (err) {
    console.error("ERROR: Failed to fetch GitHub secrets via gh CLI.");
    console.error(String(err));
    process.exit(1);
  }
}

function main() {
  console.log("🔍 Magnus Terraform / GitHub Secrets Consistency Check");
  console.log("Repo:", repo);
  console.log("TFVARS:", TFVARS_PATH);
  console.log("--------------------------------------------------");

  let tfvarsContent;
  try {
    tfvarsContent = readFileSync(TFVARS_PATH, "utf8");
  } catch (err) {
    console.error(`ERROR: Cannot read ${TFVARS_PATH}. Run from repo root.`);
    process.exit(1);
  }

  const tfvars = parseTfvars(tfvarsContent);
  const tfKeys = new Set(Object.keys(tfvars));

  const missingTfVars = REQUIRED_TF_VARS.filter((v) => !tfKeys.has(v));
  const extraTfVars = [...tfKeys].filter((v) => !REQUIRED_TF_VARS.includes(v));

  console.log("Terraform.tfvars keys:", [...tfKeys].sort().join(", "));
  console.log();

  if (missingTfVars.length === 0) {
    console.log("✅ terraform.tfvars: all required variables present.");
  } else {
    console.log("❌ terraform.tfvars: missing variables:");
    for (const v of missingTfVars) {
      console.log("   -", v);
    }
  }

  if (extraTfVars.length > 0) {
    console.log();
    console.log("⚠ terraform.tfvars: extra variables not in REQUIRED_TF_VARS:");
    for (const v of extraTfVars) {
      console.log("   -", v);
    }
  }

  console.log();
  console.log("Fetching GitHub Actions secrets for", repo, "...");
  const secrets = getGitHubSecrets(repo);

  const missingSecrets = [];
  const presentSecrets = [];

  for (const [tfVar, secretName] of Object.entries(TFVAR_TO_SECRET)) {
    if (!tfvars[tfVar]) {
      console.log(`⚠ Skipping ${secretName} (terraform var ${tfVar} missing)`);
      continue;
    }
    if (secrets.has(secretName)) {
      presentSecrets.push(secretName);
    } else {
      missingSecrets.push(secretName);
    }
  }

  console.log();
  console.log("GitHub Secrets (mapped from terraform.tfvars):");
  console.log("Present:");
  if (presentSecrets.length === 0) {
    console.log("   (none)");
  } else {
    for (const s of presentSecrets) console.log("   -", s);
  }

  console.log("Missing:");
  if (missingSecrets.length === 0) {
    console.log("   (none)");
  } else {
    for (const s of missingSecrets) console.log("   -", s);
  }

  console.log();
  if (missingTfVars.length === 0 && missingSecrets.length === 0) {
    console.log("✅ CONSISTENCY CHECK PASSED — terraform.tfvars & GitHub secrets are aligned.");
    process.exit(0);
  } else {
    console.log("❌ CONSISTENCY CHECK FAILED — fix missing variables/secrets above.");
    process.exit(1);
  }
}

main();

