// scripts/deploy/verify.mjs
/* eslint-disable no-console */

const REQUIRED_ENV = [
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

function checkEnv() {
  console.log("🔎 Magnus Flipper AI — Release Env Verification\n");

  const missing = [];

  for (const key of REQUIRED_ENV) {
    if (!process.env[key] || String(process.env[key]).trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    for (const key of missing) {
      console.error(`   - ${key}`);
    }
    console.error(
      "\nFix the above variables (in your shell, .env, or CI secrets) before releasing.",
    );
    process.exit(1);
  }

  console.log("✅ All required environment variables are present.");
  console.log("\nYou are ready to proceed to build & deploy.");
}

checkEnv();
