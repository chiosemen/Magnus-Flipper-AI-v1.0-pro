import { logger } from "./utils/logger";
import { config } from "./config";
import { detectAnomalies, calculateErrorRatios } from "./handlers/anomalyHandler";
import { dispatchAlerts } from "./handlers/alertDispatcher";
import { updateMetrics } from "./utils/health";
import { prisma } from "./services/prisma";

// Track last alert times per marketplace+errorCode to avoid spamming
const lastAlertTimes = new Map<string, number>();

export async function alertsLoop() {
  logger.info({ interval: config.pollIntervalMs }, "Starting alerts monitoring loop");

  // Initial run
  await runAlertsCheck();

  // Periodic checks
  setInterval(async () => {
    await runAlertsCheck();
  }, config.pollIntervalMs);
}

async function runAlertsCheck() {
  try {
    // Get recent scrape runs for metrics
    const timeWindow = new Date(Date.now() - config.anomalyAnalysisWindowMs);
    const recentRuns = await prisma.scrapeRun.findMany({
      where: {
        createdAt: {
          gte: timeWindow,
        },
      },
      take: 200,
    });

    // Calculate error ratios for metrics
    const errorRatios = calculateErrorRatios(recentRuns);

    // Detect anomalies
    const anomalies = await detectAnomalies();

    // Filter out recently alerted anomalies (deduplication)
    const newAnomalies = anomalies.filter((anomaly) => {
      const key = `${anomaly.marketplace}:${anomaly.errorCode || "UNKNOWN"}`;
      const lastAlertTime = lastAlertTimes.get(key) || 0;
      const now = Date.now();

      if (now - lastAlertTime < config.minAlertDelayMs) {
        return false; // Skip, too soon since last alert
      }

      lastAlertTimes.set(key, now);
      return true;
    });

    if (newAnomalies.length > 0) {
      logger.info({ count: newAnomalies.length }, `🔔 Processing ${newAnomalies.length} new anomalies`);
      await dispatchAlerts(newAnomalies);
    }

    // Update metrics
    const alertsLastHour = await prisma.scrapeRun.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 3600000), // Last hour
        },
        success: false,
      },
    });

    updateMetrics(anomalies.length, alertsLastHour, errorRatios);
  } catch (err) {
    logger.error({ err }, "Error in anomaly detection loop");
  }
}
