#!/usr/bin/env node

/**
 * Build Dashboard JSON
 * -------------------------------------------
 * Merges logs + ML results + revision info into a single dashboard JSON file
 * for the real-time canary monitor dashboard.
 */

const fs = require("fs");
const path = require("path");

const DASHBOARD_DIR = path.resolve("dashboard");
const OUTPUT_FILE = path.join(DASHBOARD_DIR, "latest_canary_status.json");

// Default structure
let ml = {
  decision: "UNKNOWN",
  confidence: 0.0,
  severity: "UNKNOWN",
  summary: "No ML analysis available yet.",
  anomalies: []
};

let logs = [];
let health = {
  success_rate: 0.0,
  total: 0,
  failures: 0,
  checks: []
};

let revisions = {
  stable: "-",
  canary: "-",
  traffic: "-"
};

// Load ML results
const mlResultPath = path.join(DASHBOARD_DIR, "ml_result.json");
if (fs.existsSync(mlResultPath)) {
  try {
    const mlResult = JSON.parse(fs.readFileSync(mlResultPath, "utf8"));
    
    // Extract decision from OpenAI/DeepSeek response
    if (mlResult.choices && mlResult.choices[0]) {
      const content = mlResult.choices[0].message?.content || "{}";
      
      // Try to parse JSON from content (might be wrapped in markdown)
      let jsonContent = content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      try {
        const parsed = JSON.parse(jsonContent);
        ml = {
          decision: parsed.decision || "UNKNOWN",
          confidence: parsed.confidence || 0.0,
          severity: parsed.severity || "UNKNOWN",
          summary: parsed.summary || "No summary available.",
          anomalies: parsed.anomalies || []
        };
      } catch (parseErr) {
        console.warn("Could not parse ML response JSON:", parseErr.message);
        // Try to extract decision from text
        if (content.includes("PROMOTE")) {
          ml.decision = "PROMOTE";
        } else if (content.includes("ROLLBACK")) {
          ml.decision = "ROLLBACK";
        } else if (content.includes("DEGRADED")) {
          ml.decision = "DEGRADED";
        }
      }
    }
  } catch (err) {
    console.warn("Error loading ML results:", err.message);
  }
}

// Load logs
const logsPath = path.join(DASHBOARD_DIR, "canary_logs.json");
if (fs.existsSync(logsPath)) {
  try {
    const logsData = JSON.parse(fs.readFileSync(logsPath, "utf8"));
    
    if (Array.isArray(logsData)) {
      logs = logsData
        .slice(-1000) // Last 1000 lines
        .map(log => {
          // Format log entry
          const timestamp = log.timestamp || log.time || log.createdTime || "";
          const level = log.level || log.severity || "INFO";
          const message = log.message || log.text || log.content || JSON.stringify(log);
          return `[${timestamp}] [${level}] ${message}`;
        });
    }
  } catch (err) {
    console.warn("Error loading logs:", err.message);
  }
}

// Load revision info (prefer revisions.json if available, fallback to revision.json)
const revisionsPath = path.join(DASHBOARD_DIR, "revisions.json");
const revisionPath = path.join(DASHBOARD_DIR, "revision.json");

if (fs.existsSync(revisionsPath)) {
  try {
    const revisionsData = JSON.parse(fs.readFileSync(revisionsPath, "utf8"));
    revisions = {
      stable: revisionsData.stable || "-",
      canary: revisionsData.canary || "-",
      traffic: revisionsData.traffic || "-"
    };
  } catch (err) {
    console.warn("Error loading revisions.json:", err.message);
  }
} else if (fs.existsSync(revisionPath)) {
  try {
    const revisionData = JSON.parse(fs.readFileSync(revisionPath, "utf8"));
    
    if (revisionData.properties) {
      revisions.canary = revisionData.name || "-";
      // Try to infer traffic split from revision properties
      if (revisionData.properties.trafficWeight) {
        const canaryWeight = revisionData.properties.trafficWeight;
        const stableWeight = 100 - canaryWeight;
        revisions.traffic = `${stableWeight}% stable / ${canaryWeight}% canary`;
      }
    }
  } catch (err) {
    console.warn("Error loading revision info:", err.message);
  }
}

// Calculate health metrics from logs
if (logs.length > 0) {
  const healthChecks = logs.filter(log => 
    log.includes("/health") || 
    log.includes("health check") ||
    log.includes("200") ||
    log.includes("500") ||
    log.includes("error")
  );
  
  const successCount = healthChecks.filter(log => 
    log.includes("200") || 
    log.includes("OK") ||
    log.includes("success")
  ).length;
  
  const failureCount = healthChecks.filter(log => 
    log.includes("500") || 
    log.includes("error") ||
    log.includes("fail")
  ).length;
  
  const total = healthChecks.length || 1;
  
  health = {
    success_rate: successCount / total,
    total: total,
    failures: failureCount,
    checks: healthChecks.slice(-20).map(log => ({
      timestamp: new Date().toISOString(),
      status: log.includes("200") || log.includes("OK") ? "OK" : "FAIL",
      log: log.substring(0, 200) // Truncate long logs
    }))
  };
}

// Build output
const output = {
  timestamp: new Date().toISOString(),
  revisions,
  ml,
  health,
  logs: logs.slice(-50) // Last 50 lines for dashboard
};

// Ensure dashboard directory exists
if (!fs.existsSync(DASHBOARD_DIR)) {
  fs.mkdirSync(DASHBOARD_DIR, { recursive: true });
}

// Write output
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log("✅ Dashboard JSON built!");
console.log(`   Output: ${OUTPUT_FILE}`);
console.log(`   ML Decision: ${ml.decision}`);
console.log(`   Logs: ${logs.length} lines`);
console.log(`   Health: ${(health.success_rate * 100).toFixed(1)}% success rate`);
