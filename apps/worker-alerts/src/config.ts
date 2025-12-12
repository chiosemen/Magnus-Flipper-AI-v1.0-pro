export const config = {
  pollIntervalMs: parseInt(process.env.ALERTS_POLL_INTERVAL_MS || "30000"), // 30s default
  port: parseInt(process.env.PORT || "3000"),
  workerId: process.env.WORKER_ID || "worker-alerts-001",
  
  // ML Configuration
  mlProvider: process.env.ML_ALERTS_PROVIDER || "none", // "openai", "deepseek", "none"
  openaiApiKey: process.env.OPENAI_API_KEY,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  
  // ML API URLs
  openaiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
  
  // Alert deduplication
  minAlertDelayMs: parseInt(process.env.MIN_ALERT_DELAY_MS || "600000"), // 10 minutes default
  
  // Time windows for analysis
  anomalyAnalysisWindowMs: parseInt(process.env.ANOMALY_ANALYSIS_WINDOW_MS || "300000"), // 5 minutes
};
