import fs from "fs";
import path from "path";
import fetch from "node-fetch";

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
const MIRROR_PATH = path.resolve("infra/azure/terraform.tfvars.github-mirror");

function parseTfvars(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*"([^"]*)"$/i);
    if (match) {
      map.set(match[1], match[2]);
    }
  }
  return map;
}

async function loadGithubSecrets(repo, token) {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/secrets`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list secrets (${res.status}): ${await res.text()}`);
  }

  const payload = await res.json();
  return new Set(payload.secrets.map((secret) => secret.name));
}

function requireGhToken() {
  const token = process.env.GH_TOKEN;
  if (!token) {
    throw new Error("Missing GH_TOKEN. Please run: export GH_TOKEN=your_token_here");
  }
  return token;
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (!args[0]) {
    throw new Error("Usage: node scripts/deploy/github-to-tfvars-mirror.mjs owner/repo [--auto-approve|--dry-run]");
  }
  const repo = args[0];
  const autoApprove = args.includes("--auto-approve");
  const dryRun = args.includes("--dry-run") || !autoApprove;
  return { repo, autoApprove, dryRun };
}

async function writeMirror(mirrorMap, placeholderKeys, presentInTfvarsOnly, missingBoth) {
  const lines = [
    "# Auto-generated mirror of terraform.tfvars using GitHub Actions secrets",
    "# This file does NOT contain real GitHub secret values.",
    "# For keys marked with \"__FILL_FROM_GITHUB_PORTAL__\", update the value manually in both tfvars and GitHub if needed.",
  ];

  const sortedKeys = Array.from(mirrorMap.keys()).sort();
  for (const key of sortedKeys) {
    if (placeholderKeys.includes(key)) {
      lines.push(`# MISSING VALUE: ${key} is present in GitHub secrets but not in terraform.tfvars`);
    }
    lines.push(`${key} = "${mirrorMap.get(key)}"`);
  }

  fs.writeFileSync(MIRROR_PATH, lines.join("\n") + "\n");
  console.log(`Mirror write complete → ${MIRROR_PATH}`);
  console.log(`- Keys mirrored: ${sortedKeys.length}`);
  console.log(`- Placeholder keys: ${placeholderKeys.length}`);
  console.log(`- Present in tfvars only: ${presentInTfvarsOnly.length}`);
  console.log(`- Missing on both: ${missingBoth.length}`);
}

async function main() {
  const { repo, autoApprove, dryRun } = parseArgs();
  const token = requireGhToken();

  if (!fs.existsSync(TFVARS_PATH)) {
    throw new Error(`❌ Missing terraform.tfvars at ${TFVARS_PATH}`);
  }

  const tfvarsContent = fs.readFileSync(TFVARS_PATH, "utf-8");
  const tfvarsMap = parseTfvars(tfvarsContent);
  const ghSecrets = await loadGithubSecrets(repo, token);

  const presentInBoth = [];
  const githubOnly = [];
  const tfvarsOnly = [];
  const missingBoth = [];

  const { mirrorMap, placeholderKeys } = compareSecrets(tfvarsMap, ghSecrets, {
    presentInBoth,
    githubOnly,
    tfvarsOnly,
    missingBoth,
  });

  console.log("GitHub → tfvars mirror analysis:");
  console.log(`- Present in BOTH: ${presentInBoth.join(", ") || "none"}`);
  console.log(`- Present in GitHub only (placeholder): ${githubOnly.join(", ") || "none"}`);
  console.log(`- Present in tfvars only: ${tfvarsOnly.join(", ") || "none"}`);
  console.log(`- Missing on BOTH: ${missingBoth.join(", ") || "none"}`);

  if (dryRun || !autoApprove) {
    if (!dryRun) {
      console.log("Dry-run mode (default) active — no files written.");
    }
    return;
  }

  await writeMirror(mirrorMap, placeholderKeys, tfvarsOnly, missingBoth);
}

function compareSecrets(tfvarsMap, ghSecrets, collectors = null) {
  const presentInBoth = collectors?.presentInBoth ?? [];
  const githubOnly = collectors?.githubOnly ?? [];
  const tfvarsOnly = collectors?.tfvarsOnly ?? [];
  const missingBoth = collectors?.missingBoth ?? [];
  const mirrorMap = new Map();
  const placeholderKeys = [];

  for (const key of REQUIRED_SECRETS) {
    const inTfvars = tfvarsMap.has(key);
    const inGithub = ghSecrets.has(key);

    if (inTfvars && inGithub) {
      presentInBoth.push(key);
      mirrorMap.set(key, tfvarsMap.get(key));
    } else if (inGithub && !inTfvars) {
      githubOnly.push(key);
      placeholderKeys.push(key);
      mirrorMap.set(key, "__FILL_FROM_GITHUB_PORTAL__");
    } else if (inTfvars && !inGithub) {
      tfvarsOnly.push(key);
      mirrorMap.set(key, tfvarsMap.get(key));
    } else {
      missingBoth.push(key);
    }
  }

  return { mirrorMap, placeholderKeys, presentInBoth, githubOnly, tfvarsOnly, missingBoth };
}

export { parseTfvars, loadGithubSecrets, compareSecrets };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Error running mirror script:", err);
    process.exit(1);
  });
}
