import { logger } from "./utils/logger";
import { healthCheck } from "./utils/health";
import { config } from "./config";
import { alertsLoop } from "./alertsLoop";

async function main() {
  logger.info({ workerId: config.workerId, pollInterval: config.pollIntervalMs }, "🔔 worker-alerts starting…");

  // 1) Health check for container probes
  healthCheck();

  // 2) Start alerts monitoring loop
  await alertsLoop();

  logger.info("worker-alerts is running 🚀");
}

main().catch((err) => {
  logger.error({ err }, "Fatal error in worker-alerts");
  process.exit(1);
});
