import { execSync } from "node:child_process";
import process from "node:process";

const projectName = process.env.VERCEL_PROJECT_NAME ?? "";
const projectId = process.env.VERCEL_PROJECT_ID ?? "";
const command = "pnpm --filter @magnus/web build";

console.log(`[deploy-build] Project: ${projectName || "unknown"} (${projectId || "no-id"})`);
console.log(`[deploy-build] Running: ${command}`);

execSync(command, { stdio: "inherit" });
