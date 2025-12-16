import { runScheduledScan } from "./scheduler.js";
import { sendHeartbeat } from "./services/telemetry.js";
import { processJob } from "./services/jobs.js";
import { scanMarketplace } from "./scheduler.js";

const WORKER_ID = process.env.WORKER_ID || "worker-001";
const HEARTBEAT_INTERVAL = parseInt(process.env.WORKER_HEARTBEAT_INTERVAL || "60000");
const SCAN_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function main() {
  console.log(`Worker ${WORKER_ID} starting...`);

  // Send initial heartbeat
  await sendHeartbeat(WORKER_ID);

  // Start heartbeat interval
  setInterval(async () => {
    await sendHeartbeat(WORKER_ID);
  }, HEARTBEAT_INTERVAL);

  // Start scheduled scans
  setInterval(async () => {
    await runScheduledScan();
  }, SCAN_INTERVAL);

  // Start job processor
  setInterval(async () => {
    await processJob(WORKER_ID, async (job) => {
      console.log(`Processing job: ${job.job_type}`);

      if (job.job_type === "scan_marketplace" && job.marketplace) {
        await scanMarketplace(job.marketplace);
        return { success: true, marketplace: job.marketplace };
      }

      return { success: true };
    }).catch(() => {
      // Job processor handles errors internally
    });
  }, 5000);

  // Run initial scan
  await runScheduledScan();

  console.log(`Worker ${WORKER_ID} running...`);
}

main().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
