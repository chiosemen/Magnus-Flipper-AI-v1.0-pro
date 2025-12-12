import http from "http";
import { logger } from "./logger";

const PORT = parseInt(process.env.PORT || "3000");
const WORKER_ID = process.env.WORKER_ID || "worker-alerts-001";

// Metrics tracking
let metrics = {
  recentAnomalies: 0,
  alertsGeneratedLastHour: 0,
  marketplaceErrorRatios: {} as Record<string, { errors: number; total: number }>,
  lastCheckTime: new Date().toISOString(),
  totalChecks: 0,
};

export function healthCheck() {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          worker: WORKER_ID,
          timestamp: new Date().toISOString(),
          recentChecks: {
            lastCheck: metrics.lastCheckTime,
            totalChecks: metrics.totalChecks,
          },
        })
      );
    } else if (req.url === "/metrics") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          recentAnomalies: metrics.recentAnomalies,
          alertsGeneratedLastHour: metrics.alertsGeneratedLastHour,
          marketplaceErrorRatios: metrics.marketplaceErrorRatios,
          lastCheckTime: metrics.lastCheckTime,
          totalChecks: metrics.totalChecks,
        })
      );
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, () => {
    logger.info(`❤️ Health server running on port ${PORT}`);
  });
}

export function updateMetrics(anomalies: number, alerts: number, errorRatios: Record<string, { errors: number; total: number }>) {
  metrics.recentAnomalies = anomalies;
  metrics.alertsGeneratedLastHour = alerts;
  metrics.marketplaceErrorRatios = errorRatios;
  metrics.lastCheckTime = new Date().toISOString();
  metrics.totalChecks++;
}
