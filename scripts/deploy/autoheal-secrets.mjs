import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import sodium from "libsodium-wrappers";

const REQUIRED_SECRETS = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "OPENAI_API_KEY",
  "APP_URL",
  "NODE_ENV",
];

const TFVARS_PATH = path.resolve("infra/azure/terraform.tfvars");

function parseTfvars(content) {
  const lines = content.split(/\r?\n/);
  const values = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*"([^"]*)"$/i);
    if (match) {
      values.set(match[1], match[2]);
    }
  }

  return values;
}

async function fetchGithubSecrets(repo, token) {
  const url = `https://api.github.com/repos/${repo}/actions/secrets`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list secrets (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return new Set(data.secrets.map((secret) => secret.name));
}

async function getPublicKey(repo, token) {
  const url = `https://api.github.com/repos/${repo}/actions/secrets/public-key`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch public key (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

async function encryptSecret(publicKey, value) {
  await sodium.ready;
  const messageBytes = Buffer.from(value);
  const keyBytes = Buffer.from(publicKey.key, "base64");
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  return Buffer.from(encryptedBytes).toString("base64");
}

async function createSecret(repo, token, keyName, value, publicKey) {
  const encrypted = await encryptSecret(publicKey, value);
  const url = `https://api.github.com/repos/${repo}/actions/secrets/${keyName}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      encrypted_value: encrypted,
      key_id: publicKey.key_id,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create secret ${keyName} (${res.status}): ${await res.text()}`);
  }
}

function requireGhToken() {
  const token = process.env.GH_TOKEN;
  if (!token) {
    console.error("❌ Missing GH_TOKEN. Run: export GH_TOKEN=your_token_here");
    process.exit(1);
  }
  return token;
}

function parseArgs() {
  const raw = process.argv.slice(2);
  const repo = raw[0];
  const autoApprove = raw.includes("--auto-approve");
  const dryRun = raw.includes("--dry-run");
  if (!repo) {
    console.error("Usage: node scripts/deploy/autoheal-secrets.mjs owner/repo [--auto-approve] [--dry-run]");
    process.exit(1);
  }
  return { repo, autoApprove, dryRun };
}

async function main() {
  const { repo, autoApprove, dryRun } = parseArgs();
  const token = requireGhToken();

  if (!fs.existsSync(TFVARS_PATH)) {
    console.error(`❌ Missing terraform.tfvars at ${TFVARS_PATH}`);
    process.exit(1);
  }

  const tfvars = fs.readFileSync(TFVARS_PATH, "utf-8");
  const tfvarsMap = parseTfvars(tfvars);

  let secrets;
  try {
    secrets = await fetchGithubSecrets(repo, token);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  const missing = REQUIRED_SECRETS.filter((name) => !secrets.has(name));
  const presentExtra = REQUIRED_SECRETS.filter((name) => secrets.has(name) && !tfvarsMap.has(name));

  console.log("Secrets summary:");
  console.log(`- Missing on GitHub: ${missing.join(", ") || "none"}`);
  console.log(`- Present in GitHub but missing in tfvars: ${presentExtra.join(", ") || "none"}`);

  if (dryRun) {
    console.log("Dry run complete. No secrets were modified.");
    process.exit(0);
  }

  if (!missing.length) {
    console.log("No missing secrets detected. Nothing to auto-heal.");
    process.exit(0);
  }

  for (const key of missing) {
    if (!tfvarsMap.has(key)) {
      console.error(`❌ Tfvars missing value for ${key}; cannot sync.`);
      process.exit(1);
    }
  }

  const publicKey = await getPublicKey(repo, token);
  let created = 0;

  for (const key of missing) {
    await createSecret(repo, token, key, tfvarsMap.get(key), publicKey);
    console.log(`Created secret ${key}`);
    created += 1;
  }

  console.log(`Auto-heal complete. Created ${created} secret(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
