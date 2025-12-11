const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Safety toggles
const ENABLE_APPLY = true;          // set false for PLAN ONLY
const ENABLE_HEALTH_CHECKS = true;  // set false to skip curl checks
const MAX_HEALTH_RETRIES = 10;
const HEALTH_RETRY_DELAY_MS = 10000; // 10 seconds

// Azure constants (must match your infra)
const AZURE_RESOURCE_GROUP = "magnus-rg";
const AZURE_CONTAINERAPPS_ENV = "magnus-ca-env";

// Worker app names (must match infra/azure/main.tf)
const WORKER_REALTIME_APP = "mf-worker-realtime";
const WORKER_SCHEDULER_APP = "mf-worker-scheduler";

// ACR name
const ACR_NAME = "magnusacr";

// Small helper to run shell commands with nice logging
function run(cmd, options = {}) {
  console.log(`\n▶️  ${cmd}`);
  try {
    const out = execSync(cmd, { stdio: "pipe", encoding: "utf8", ...options });
    if (out.trim()) {
      console.log(out.trim());
    }
    return { ok: true, out };
  } catch (err) {
    console.error(`❌ Command failed: ${cmd}`);
    if (err.stdout) console.error(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    return { ok: false, err };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check Azure auth + subscription
function checkAzureAuth() {
  console.log("🔍 Checking Azure authentication & subscription…");

  const who = run("az account show -o table");
  if (!who.ok) {
    throw new Error("Azure CLI not authenticated. Run `az login` first.");
  }
}

// Check that ACR has worker images
function checkAcrImages() {
  console.log("\n🔍 Checking ACR repositories for worker images…");

  const reposRes = run(`az acr repository list --name ${ACR_NAME} -o tsv`);
  if (!reposRes.ok) {
    throw new Error(`Failed to list ACR repos for ${ACR_NAME}`);
  }

  const repos = reposRes.out.split("\n").map(r => r.trim()).filter(Boolean);
  console.log("📦 ACR Repositories:", repos.join(", "));

  const expected = [
    "magnus-worker-realtime",
    "magnus-worker-scheduler"
  ];

  expected.forEach(repo => {
    if (!repos.includes(repo)) {
      console.warn(`⚠️  Missing ACR repo: ${repo}`);
    }
  });

  expected.forEach(repo => {
    console.log(`\n🔍 Checking tags for ${repo}…`);
    const tagsRes = run(
      `az acr repository show-tags --name ${ACR_NAME} --repository ${repo} --orderby time_desc --top 3 -o tsv`
    );
    if (!tagsRes.ok || !tagsRes.out.trim()) {
      console.warn(`⚠️  No tags found for ${repo}. Did you run ./scripts/build-push-workers.sh?`);
    } else {
      console.log(`✅ Tags for ${repo}:`);
      console.log(tagsRes.out.trim());
    }
  });
}

// Terraform helpers
function terraformInit() {
  console.log("\n🧱 Terraform init…");
  return run("terraform init -input=false", { cwd: path.join(process.cwd(), "infra/azure") });
}

function terraformValidate() {
  console.log("\n✅ Terraform validate…");
  return run("terraform validate", { cwd: path.join(process.cwd(), "infra/azure") });
}

function terraformPlan() {
  console.log("\n📐 Terraform plan (tfplan-workers)…");
  return run("terraform plan -out=tfplan-workers", {
    cwd: path.join(process.cwd(), "infra/azure")
  });
}

function terraformApply() {
  console.log("\n🚀 Terraform apply (tfplan-workers)…");
  return run("terraform apply -auto-approve tfplan-workers", {
    cwd: path.join(process.cwd(), "infra/azure")
  });
}

// Get Container App FQDN
function getContainerAppFqdn(appName) {
  const cmd = `az containerapp show --name ${appName} --resource-group ${AZURE_RESOURCE_GROUP} --query properties.configuration.ingress.fqdn -o tsv`;
  const res = run(cmd);
  if (!res.ok || !res.out.trim()) {
    throw new Error(`Failed to get FQDN for container app: ${appName}`);
  }
  return res.out.trim();
}

// Health check with retries
async function checkHealth(fqdn, label) {
  if (!ENABLE_HEALTH_CHECKS) {
    console.log(`⏭️  Skipping health checks for ${label} (disabled)`);
    return;
  }

  console.log(`\n🩺 Health check for ${label} at https://${fqdn}/health`);

  for (let attempt = 1; attempt <= MAX_HEALTH_RETRIES; attempt++) {
    console.log(`⏳ Attempt ${attempt}/${MAX_HEALTH_RETRIES}…`);

    const cmd = `curl -k -s -o /dev/null -w "%{http_code}" https://${fqdn}/health || echo "000"`;
    const res = run(cmd);

    if (!res.ok) {
      console.log("⚠️ curl command failed, will retry…");
    } else {
      const code = (res.out || "").trim();
      console.log(`↪️ HTTP status: ${code}`);
      if (code.startsWith("2")) {
        console.log(`✅ ${label} is healthy!`);
        return;
      }
    }

    if (attempt < MAX_HEALTH_RETRIES) {
      await sleep(HEALTH_RETRY_DELAY_MS);
    }
  }

  throw new Error(`❌ ${label} failed health checks after ${MAX_HEALTH_RETRIES} attempts`);
}

(async () => {
  try {
    console.log("========================================");
    console.log("  Terraform Apply Orchestrator v2");
    console.log("  Workers + Health Checks");
    console.log("========================================\n");

    // 1) Azure auth
    checkAzureAuth();

    // 2) ACR image presence
    checkAcrImages();

    // 3) Terraform init/validate/plan
    const initRes = terraformInit();
    if (!initRes.ok) throw new Error("terraform init failed");

    const validateRes = terraformValidate();
    if (!validateRes.ok) throw new Error("terraform validate failed");

    const planRes = terraformPlan();
    if (!planRes.ok) throw new Error("terraform plan failed");

    if (!ENABLE_APPLY) {
      console.log("\n🧪 ENABLE_APPLY=false → PLAN ONLY mode. No resources were changed.");
      process.exit(0);
    }

    // 4) Apply
    const applyRes = terraformApply();
    if (!applyRes.ok) throw new Error("terraform apply failed");

    // 5) Post-deploy health checks
    console.log("\n🌐 Fetching Container App FQDNs…");
    const realtimeFqdn = getContainerAppFqdn(WORKER_REALTIME_APP);
    const schedulerFqdn = getContainerAppFqdn(WORKER_SCHEDULER_APP);

    console.log(`Realtime worker FQDN:  ${realtimeFqdn}`);
    console.log(`Scheduler worker FQDN: ${schedulerFqdn}`);

    await checkHealth(realtimeFqdn, "Realtime Worker");
    await checkHealth(schedulerFqdn, "Scheduler Worker");

    console.log("\n✅ All workers deployed and healthy. Terraform Apply v2 complete.");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Terraform Apply Orchestrator v2 failed.");
    console.error(err.message || err);
    process.exit(1);
  }
})();
