import { logger } from "./utils/logger";
import { config } from "./config";
import { Anomaly } from "./handlers/anomalyHandler";

export interface AnomalyBatch {
  marketplace: string;
  errorPatterns: Array<{
    errorCode: string | null;
    errorMessage: string | null;
    count: number;
  }>;
  totalErrors: number;
  totalRuns: number;
  recentLogs: string[]; // Short text snippets only
  timeWindow: string;
}

export interface MlClassificationResult {
  severity: "INFO" | "WARNING" | "CRITICAL";
  category: "RATE_LIMIT" | "BLOCK" | "NETWORK" | "OTHER";
  summary: string;
  confidence: number;
  recommendations: string[];
}

// Heuristic fallback classification
function heuristicClassification(batch: AnomalyBatch): MlClassificationResult {
  const errorRatio = batch.totalErrors / Math.max(batch.totalRuns, 1);
  
  let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
  let category: "RATE_LIMIT" | "BLOCK" | "NETWORK" | "OTHER" = "OTHER";
  
  // Determine severity
  if (errorRatio > 0.5 || batch.totalErrors >= 20) {
    severity = "CRITICAL";
  } else if (errorRatio > 0.2 || batch.totalErrors >= 5) {
    severity = "WARNING";
  }
  
  // Determine category based on error patterns
  const errorCodes = batch.errorPatterns.map((p) => p.errorCode?.toUpperCase() || "");
  if (errorCodes.some((code) => /RATE|429|THROTTLE|LIMIT/i.test(code))) {
    category = "RATE_LIMIT";
  } else if (errorCodes.some((code) => /BLOCK|403|FORBIDDEN|BAN/i.test(code))) {
    category = "BLOCK";
  } else if (errorCodes.some((code) => /NETWORK|TIMEOUT|CONNECT|ECONN/i.test(code))) {
    category = "NETWORK";
  }
  
  const recommendations: string[] = [];
  if (category === "RATE_LIMIT") {
    recommendations.push("Reduce scraping frequency for this marketplace");
    recommendations.push("Implement exponential backoff");
  } else if (category === "BLOCK") {
    recommendations.push("Review marketplace terms of service");
    recommendations.push("Consider rotating IP addresses or user agents");
  } else if (category === "NETWORK") {
    recommendations.push("Check network connectivity");
    recommendations.push("Verify marketplace API availability");
  } else {
    recommendations.push("Investigate error patterns");
    recommendations.push("Review recent code changes");
  }
  
  return {
    severity,
    category,
    summary: `${batch.marketplace}: ${batch.totalErrors} errors detected (${(errorRatio * 100).toFixed(1)}% failure rate)`,
    confidence: 0.6, // Lower confidence for heuristics
    recommendations,
  };
}

// OpenAI classification
async function classifyWithOpenAI(batch: AnomalyBatch): Promise<MlClassificationResult> {
  if (!config.openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `Analyze this marketplace scraping anomaly batch and classify it.

Marketplace: ${batch.marketplace}
Total Errors: ${batch.totalErrors}
Total Runs: ${batch.totalRuns}
Error Ratio: ${((batch.totalErrors / Math.max(batch.totalRuns, 1)) * 100).toFixed(1)}%

Error Patterns:
${batch.errorPatterns.map((p) => `- ${p.errorCode || "UNKNOWN"}: ${p.count} occurrences`).join("\n")}

Recent Error Messages (sample):
${batch.recentLogs.slice(0, 5).join("\n")}

Classify this anomaly and return ONLY valid JSON:
{
  "severity": "INFO" | "WARNING" | "CRITICAL",
  "category": "RATE_LIMIT" | "BLOCK" | "NETWORK" | "OTHER",
  "summary": "Brief summary of the anomaly",
  "confidence": 0.0-1.0,
  "recommendations": ["action 1", "action 2"]
}`;

  try {
    const { default: fetch } = await import("node-fetch");
    const response = await fetch(`${config.openaiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert SRE analyzing marketplace scraping anomalies. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = (data as any)?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(content);
    return {
      severity: parsed.severity || "WARNING",
      category: parsed.category || "OTHER",
      summary: parsed.summary || "Anomaly detected",
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    logger.error({ error, marketplace: batch.marketplace }, "OpenAI classification failed");
    throw error;
  }
}

// DeepSeek classification
async function classifyWithDeepSeek(batch: AnomalyBatch): Promise<MlClassificationResult> {
  if (!config.deepseekApiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  const prompt = `Analyze this marketplace scraping anomaly batch and classify it.

Marketplace: ${batch.marketplace}
Total Errors: ${batch.totalErrors}
Total Runs: ${batch.totalRuns}
Error Ratio: ${((batch.totalErrors / Math.max(batch.totalRuns, 1)) * 100).toFixed(1)}%

Error Patterns:
${batch.errorPatterns.map((p) => `- ${p.errorCode || "UNKNOWN"}: ${p.count} occurrences`).join("\n")}

Recent Error Messages (sample):
${batch.recentLogs.slice(0, 5).join("\n")}

Classify this anomaly and return ONLY valid JSON:
{
  "severity": "INFO" | "WARNING" | "CRITICAL",
  "category": "RATE_LIMIT" | "BLOCK" | "NETWORK" | "OTHER",
  "summary": "Brief summary of the anomaly",
  "confidence": 0.0-1.0,
  "recommendations": ["action 1", "action 2"]
}`;

  try {
    const { default: fetch } = await import("node-fetch");
    const response = await fetch(`${config.deepseekBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert SRE analyzing marketplace scraping anomalies. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = (data as any)?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from DeepSeek");
    }

    const parsed = JSON.parse(content);
    return {
      severity: parsed.severity || "WARNING",
      category: parsed.category || "OTHER",
      summary: parsed.summary || "Anomaly detected",
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    logger.error({ error, marketplace: batch.marketplace }, "DeepSeek classification failed");
    throw error;
  }
}

// Main ML analysis function
export async function analyzeAnomalies(batch: AnomalyBatch): Promise<MlClassificationResult> {
  // If no ML provider configured, use heuristics
  if (config.mlProvider === "none" || !config.mlProvider) {
    logger.debug({ marketplace: batch.marketplace }, "Using heuristic classification (no ML provider)");
    return heuristicClassification(batch);
  }

  // Try ML classification with fallback to heuristics
  try {
    if (config.mlProvider === "openai" && config.openaiApiKey) {
      logger.debug({ marketplace: batch.marketplace }, "Classifying with OpenAI");
      return await classifyWithOpenAI(batch);
    } else if (config.mlProvider === "deepseek" && config.deepseekApiKey) {
      logger.debug({ marketplace: batch.marketplace }, "Classifying with DeepSeek");
      return await classifyWithDeepSeek(batch);
    } else {
      logger.warn(
        { provider: config.mlProvider, hasOpenAIKey: !!config.openaiApiKey, hasDeepSeekKey: !!config.deepseekApiKey },
        "ML provider configured but API key missing, falling back to heuristics"
      );
      return heuristicClassification(batch);
    }
  } catch (error) {
    logger.warn({ error, marketplace: batch.marketplace }, "ML classification failed, falling back to heuristics");
    return heuristicClassification(batch);
  }
}
