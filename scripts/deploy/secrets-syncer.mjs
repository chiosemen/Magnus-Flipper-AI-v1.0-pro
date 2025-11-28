#!/usr/bin/env node
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

/**
 * Magnus Secrets Syncer
 * ---------------------
 * Reads terraform.tfvars → syncs missing variables into GitHub Actions Secrets.
 *
 * Usage:
 *    node secrets-syncer.mjs <owner/repo>
 *
 * Requirements:
 *    export GH_TOKEN=ghp_xxxxxx
 */

// -----------------------------------------------------------------------------
// Setup
// -----------------------------------------------------------------------------
const repo = process.argv[2];
if (!repo) {
  console.error("❌ Usage: node secrets-syncer.mjs <owner/repo>");
  process.exit(1);
}

const GH_TOKEN = process.env.GH_TOKEN;
if (!GH_TOKEN) {
  console.error("❌ Missing GH_TOKEN. Run: export GH_TOKEN=your_token_here");
  process.exit(1);
}

const TFVARS_PATH = path.join("infra", "azure", "terraform.tfvars");

console.log("==============================================================");
console.log("🔐  MAGNUS SECRETS SYNCER");
console.log("==============================================================");
console.log(`Repo: ${repo}`);
console.log(`TFVARS: ${TFVARS_PATH}`);
console.log("--------------------------------------------------------------");

// -----------------------------------------------------------------------------
// Read terraform.tfvars
// -----------------------------------------------------------------------------
if (!fs.existsSync(TFVARS_PATH)) {
  console.error(`❌ Cannot find terraform.tfvars at ${TFVARS_PATH}`);
  process.exit(1);
}

const tfvarsRaw = fs.readFileSync(TFVARS_PATH, "utf8");

// Convert TFvars to key/value map
const tfvars = {};
for (const line of tfvarsRaw.split("\n")) {
  const match = line.match(/^([\w_]+)\s*=\s*"?([^"]*)"?$/);
  if (match) {
    const [, key, value] = match;
    tfvars[key] = value;
  }
}

console.log("Terraform Keys Found:", Object.keys(tfvars).join(", "));
console.log("--------------------------------------------------------------");

// -----------------------------------------------------------------------------
// GitHub Secrets Fetcher
// -----------------------------------------------------------------------------
async function fetchSecrets() {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/secrets`, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    console.error("❌ Failed to fetch GitHub secrets:", await res.text());
    process.exit(1);
  }

  const data = await res.json();
  return data.secrets.map((s) => s.name);
}

// -----------------------------------------------------------------------------
// GitHub Public Key Fetcher (required to encrypt secrets)
// -----------------------------------------------------------------------------
async function fetchPublicKey() {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/secrets/public-key`,
    {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  const data = await res.json();
  if (!data.key) {
    console.error("❌ Could not get GitHub public key:", data);
    process.exit(1);
  }
  return data;
}

// -----------------------------------------------------------------------------
// Encrypt secret for GitHub API
// -----------------------------------------------------------------------------
import sodium from "libsodium-wrappers";

async function encryptSecret(publicKey, value) {
  await sodium.ready;
  const binkey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const binsec = sodium.from_string(value);

  const encBytes = sodium.crypto_box_seal(binsec, binkey);
  return sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
}

// -----------------------------------------------------------------------------
// Push secret to GitHub
// -----------------------------------------------------------------------------
async function pushSecret(name, value, publicKey, keyId) {
  const encryptedValue = await encryptSecret(publicKey, value);

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/secrets/${name}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        encrypted_value: encryptedValue,
        key_id: keyId,
      }),
    }
  );

  if (!res.ok) {
    console.error(`❌ Failed to set secret ${name}:`, await res.text());
  } else {
    console.log(`✅ Secret synced: ${name}`);
  }
}

// -----------------------------------------------------------------------------
// Sync Logic
// -----------------------------------------------------------------------------
(async () => {
  console.log("🔍 Fetching GitHub Secrets...");
  const githubSecrets = await fetchSecrets();

  console.log("Current GitHub Secrets:", githubSecrets.join(", "));
  console.log("--------------------------------------------------------------");

  const requiredMap = {
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

  const publicKeyData = await fetchPublicKey();

  for (const [tfKey, ghKey] of Object.entries(requiredMap)) {
    const value = tfvars[tfKey];

    if (!value) {
      console.log(`⚠️  Missing in terraform.tfvars: ${tfKey}`);
      continue;
    }

    if (githubSecrets.includes(ghKey)) {
      console.log(`✔️  Already present: ${ghKey}`);
      continue;
    }

    console.log(`🔄 Syncing secret: ${ghKey} → ${value}`);
    await pushSecret(ghKey, value, publicKeyData.key, publicKeyData.key_id);
  }

  console.log("--------------------------------------------------------------");
  console.log("🎉 Secrets Sync Complete!");
})();


