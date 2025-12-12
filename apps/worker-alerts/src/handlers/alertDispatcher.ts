import { logger } from "../utils/logger";
import { Anomaly } from "./anomalyHandler";
import { notifyConsole } from "../notifiers";
import { analyzeAnomalies, AnomalyBatch } from "../mlClient";
import { config } from "../config";
import { prisma } from "../services/prisma";

export async function dispatchAlerts(anomalies: Anomaly[]) {
  for (const anomaly of anomalies) {
    try {
      // Prepare batch for ML analysis
      const batch: AnomalyBatch = {
        marketplace: anomaly.marketplace,
        errorPatterns: [
          {
            errorCode: anomaly.errorCode,
            errorMessage: anomaly.errorMessage,
            count: anomaly.count,
          },
        ],
        totalErrors: anomaly.count,
        totalRuns: anomaly.count + 10, // Estimate: assume some successful runs
        recentLogs: anomaly.recentRuns
          .slice(0, 5)
          .map((r) => `${r.errorCode || "UNKNOWN"}: ${r.errorMessage || "No message"}`)
          .filter((msg) => msg.length < 200), // Keep logs short
        timeWindow: `${config.anomalyAnalysisWindowMs}ms`,
      };

      // Get ML classification (with fallback to heuristics)
      let mlResult;
      let mlProvider: string | null = null;
      try {
        mlResult = await analyzeAnomalies(batch);
        mlProvider = config.mlProvider !== "none" ? config.mlProvider : null;
      } catch (error) {
        logger.warn({ error, marketplace: anomaly.marketplace }, "ML analysis failed, using fallback");
        // Fallback handled inside analyzeAnomalies, but catch here for safety
        mlResult = {
          severity: "WARNING" as const,
          category: "OTHER" as const,
          summary: `Anomaly detected: ${anomaly.errorCode || "UNKNOWN_ERROR"} in ${anomaly.marketplace}`,
          confidence: 0.6,
          recommendations: [`Investigate ${anomaly.marketplace} scraping errors`],
        };
      }

      const alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        marketplace: anomaly.marketplace,
        severity: mlResult.severity,
        summary: mlResult.summary,
        category: mlResult.category,
        confidence: mlResult.confidence,
        recommendations: mlResult.recommendations,
        rawContext: {
          errorCode: anomaly.errorCode,
          errorMessage: anomaly.errorMessage,
          count: anomaly.count,
          recentRuns: anomaly.recentRuns.slice(0, 5), // Limit context size
        },
        mlProvider,
        createdAt: new Date(),
      };

      // Persist to database
      try {
        await prisma.operationalAlert.create({
          data: {
            marketplace: alert.marketplace,
            severity: alert.severity,
            summary: alert.summary,
            category: alert.category,
            mlProvider: alert.mlProvider,
            confidence: alert.confidence,
            rawContext: alert.rawContext as any,
            recommendations: alert.recommendations,
          },
        });
        logger.debug({ alertId: alert.id }, "Alert persisted to database");
      } catch (dbError) {
        logger.error({ error: dbError, alert }, "Failed to persist alert to database");
        // Continue with notification even if DB write fails
      }

      // Notify (console for now, email/Slack hooks available)
      await notifyConsole(alert);

      logger.info(
        {
          marketplace: anomaly.marketplace,
          errorCode: anomaly.errorCode,
          count: anomaly.count,
          severity: mlResult.severity,
          category: mlResult.category,
          mlProvider,
        },
        `🔔 Alert dispatched for ${anomaly.marketplace}`
      );
    } catch (error) {
      logger.error({ error, anomaly }, "Failed to dispatch alert");
    }
  }
}
