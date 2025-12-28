import { execSync } from "node:child_process";
import process from "node:process";

const projectName = process.env.VERCEL_PROJECT_NAME ?? "";
const projectId = process.env.VERCEL_PROJECT_ID ?? "";
const isGuardianProject =
  projectName.includes("deploy-guardian") ||
  projectName.includes("guardian") ||
  projectId.includes("deploy-guardian");

const command = isGuardianProject
  ? "pnpm --filter @magnus/deploy-guardian-api build"
  : "pnpm --filter web build";

console.log(`[vercel-build] Project: ${projectName || "unknown"} (${projectId || "no-id"})`);
console.log(`[vercel-build] Running: ${command}`);

execSync(command, { stdio: "inherit" });
