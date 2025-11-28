import fs from "fs";
import path from "path";

const REQUIRED = [
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

const tfvarsPath = path.resolve("infra/azure/terraform.tfvars");

function parseTfvars(file) {
  const map = new Map();
  for (const line of file.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*"(.*)"/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

async function main() {
  console.log("🔐 Pre-Launch Secrets Integrity Gate");

  if (!fs.existsSync(tfvarsPath)) {
    console.error("❌ ERROR: terraform.tfvars missing.");
    process.exit(1);
  }

  const raw = fs.readFileSync(tfvarsPath, "utf8");
  const tfvars = parseTfvars(raw);

  const missing = REQUIRED.filter((k) => !tfvars.has(k));
  const empty = REQUIRED.filter((k) => tfvars.get(k)?.trim() === "");

  if (missing.length === 0 && empty.length === 0) {
    console.log("✅ All required secrets are present and non-empty.");
    process.exit(0);
  }

  console.error("❌ Pre-launch integrity violation.");
  if (missing.length) console.error("Missing:", missing);
  if (empty.length) console.error("Empty:", empty);

  process.exit(1);
}

main().catch((err) => {
  console.error("Gate error:", err);
  process.exit(1);
});
