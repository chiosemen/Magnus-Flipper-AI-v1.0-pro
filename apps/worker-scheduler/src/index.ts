import { runScheduledScan } from "./scheduler";
import { sendHeartbeat } from "./services/telemetry";
import http from "http";

const WORKER_ID = process.env.WORKER_ID || "worker-scheduler-001";
const HEARTBEAT_INTERVAL = parseInt(process.env.WORKER_HEARTBEAT_INTERVAL || "60000");
const SCAN_INTERVAL = parseInt(process.env.SCAN_INTERVAL || "600000"); // 10 minutes default
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
  console.log(`Worker Scheduler ${WORKER_ID} starting...`);

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

  // Run initial scan
  await runScheduledScan();

  console.log(`Worker Scheduler ${WORKER_ID} running... (scan interval: ${SCAN_INTERVAL / 1000}s)`);
}

main().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
