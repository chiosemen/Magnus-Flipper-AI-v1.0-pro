import { processJob } from "./services/jobs";
import { sendHeartbeat } from "./services/telemetry";
import { scanMarketplace } from "./scheduler";
import { processPendingListings } from "./jobs/hydrateListing";
import { hydrateListing } from "./jobs/hydrateListing";
import http from "http";

const WORKER_ID = process.env.WORKER_ID || "worker-realtime-001";
const HEARTBEAT_INTERVAL = parseInt(process.env.WORKER_HEARTBEAT_INTERVAL || "60000");
const PORT = parseInt(process.env.PORT || "3000");

// Worker heartbeat tracking
const workerHeartbeat = {
  startTime: new Date().toISOString(),
  lastHeartbeat: new Date().toISOString(),
  lastJobProcessed: null as string | null,
  totalJobsProcessed: 0,
  totalListingsHydrated: 0,
  lastHydrationBatch: null as string | null,
};

// Simple health check server
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    workerHeartbeat.lastHeartbeat = new Date().toISOString();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      status: "ok", 
      worker: WORKER_ID, 
      timestamp: new Date().toISOString(),
      uptime: Date.now() - new Date(workerHeartbeat.startTime).getTime(),
      heartbeat: workerHeartbeat,
    }));
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
      console.log(`[${WORKER_ID}] 🔄 Processing job ${job.id}: ${job.job_type}`);
      workerHeartbeat.lastJobProcessed = new Date().toISOString();
      workerHeartbeat.totalJobsProcessed++;

      if (job.job_type === "scan_marketplace" && job.marketplace) {
        await scanMarketplace(job.marketplace);
        console.log(`[${WORKER_ID}] ✅ Completed scan for ${job.marketplace}`);
        return { success: true, marketplace: job.marketplace };
      }

      if (job.job_type === "hydrate_listing" && job.marketplace && job.url) {
        const result = await hydrateListing(job.marketplace, job.url);
        workerHeartbeat.totalListingsHydrated++;
        console.log(`[${WORKER_ID}] ✅ Hydrated listing from ${job.marketplace}`);
        return result;
      }

      return { success: true };
    }).catch((error) => {
      // Job processor handles errors internally
      console.error(`[${WORKER_ID}] ❌ Job processing error:`, error);
    });
  }, 5000); // Check for jobs every 5 seconds

  // Process pending listings (user-submitted URLs) every 2 minutes
  setInterval(async () => {
    try {
      const result = await processPendingListings();
      if (result.processed > 0) {
        workerHeartbeat.lastHydrationBatch = new Date().toISOString();
        workerHeartbeat.totalListingsHydrated += result.succeeded;
        console.log(`[${WORKER_ID}] 📦 Processed ${result.processed} pending listings: ${result.succeeded} succeeded, ${result.failed} failed`);
      }
    } catch (error) {
      console.error(`[${WORKER_ID}] ❌ Error processing pending listings:`, error);
    }
  }, 2 * 60 * 1000); // Every 2 minutes

  console.log(`Worker Realtime ${WORKER_ID} running...`);
}

main().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
