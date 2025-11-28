console.log("🧪 Running github-to-tfvars-mirror.test.mjs");

// Import ONLY what the script exports
const {
  parseTfvars,
  loadGithubSecrets,
  compareSecrets,
} = await import("../github-to-tfvars-mirror.mjs");

// -----------------------------------------------------
//  BASIC TEST — parseTfvars
// -----------------------------------------------------
const example = `
subscription_id = "123"
location = "eastus"
`;

const parsed = parseTfvars(example);

console.log("Parsed Output:", parsed);

if (!parsed.subscription_id || parsed.subscription_id !== "123") {
  console.error("❌ parseTfvars test failed.");
  process.exit(1);
}

console.log("✅ parseTfvars test passed");
