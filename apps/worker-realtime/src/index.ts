import { processJob } from "./services/jobs";
import { sendHeartbeat } from "./services/telemetry";
import { scanMarketplace } from "./scheduler";
import http from "http";

const WORKER_ID = process.env.WORKER_ID || "worker-realtime-001";
const HEARTBEAT_INTERVAL = parseInt(process.env.WORKER_HEARTBEAT_INTERVAL || "60000");
const PORT = parseInt(process.env.PORT || "3000");

// Simple health check server
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", worker: WORKER_ID, timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Health check server listening on port ${PORT}`);
});

async function main() {
  console.log(`Worker Realtime ${WORKER_ID} starting...`);

  // Send initial heartbeat
  await sendHeartbeat(WORKER_ID);

  // Start heartbeat interval
  setInterval(async () => {
    await sendHeartbeat(WORKER_ID);
  }, HEARTBEAT_INTERVAL);

  // Start job processor - processes jobs from queue in real-time
  setInterval(async () => {
    await processJob(WORKER_ID, async (job) => {
      console.log(`Processing job ${job.id}: ${job.job_type}`);

      if (job.job_type === "scan_marketplace" && job.marketplace) {
        await scanMarketplace(job.marketplace);
        return { success: true, marketplace: job.marketplace };
      }

      return { success: true };
    }).catch((error) => {
      // Job processor handles errors internally
      console.error("Job processing error:", error);
    });
  }, 5000); // Check for jobs every 5 seconds

  console.log(`Worker Realtime ${WORKER_ID} running...`);
}

main().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
