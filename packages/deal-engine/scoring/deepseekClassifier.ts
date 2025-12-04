import axios from "axios";
import type { EnrichedListing } from "../types/Listing.js";
import type { LLMClassification, RiskLevel } from "../types/DealScore.js";
import type { DealEngineConfig } from "../config.js";

/**
 * DeepSeek R1 Deal Classifier
 * Uses DeepSeek's reasoning model for marketplace arbitrage evaluation
 */

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

interface DeepSeekClassification {
  score: number;
  confidence: number;
  fairValue: number;
  riskLevel: "green" | "amber" | "red";
  riskFactors: string[];
  reasoning: string;
}

/**
 * Build the DeepSeek prompt for deal evaluation
 */
function buildDeepSeekPrompt(listing: EnrichedListing): string {
  const comparablesText = listing.comparableSales
    ? listing.comparableSales
        .map(
          (sale) =>
            `- ${sale.title}: $${sale.price} (${sale.condition}, sold ${sale.soldDate})`
        )
        .join("\n")
    : "No comparable sales data available.";

  return `You are an expert marketplace arbitrage analyst evaluating resale opportunities.

Analyze this listing and provide a structured JSON response with your evaluation.

**LISTING DETAILS:**
- Title: ${listing.title}
- Price: $${listing.price}
- Original Price (MSRP): ${listing.msrp ? `$${listing.msrp}` : "Unknown"}
- Condition: ${listing.condition}
- Category: ${listing.category || "Unknown"}
- Location: ${listing.location || "Not specified"}
- Description: ${listing.description || "No description provided"}

**COMPARABLE SALES:**
${comparablesText}

**EVALUATION CRITERIA:**

1. **Deal Score (0-100):**
   - Consider asking price vs. market value
   - Factor in condition and completeness
   - Account for category demand and seasonality
   - BE REALISTIC: Most deals are 40-70 range
   - Only exceptional deals score 80+

2. **Confidence Level (0-100):**
   - How certain are you about this evaluation?
   - More data = higher confidence

3. **Fair Market Value:**
   - What would this item realistically sell for?
   - Consider condition, market demand, and comparables

4. **Risk Assessment:**
   - green: Low risk, good opportunity
   - amber: Medium risk, proceed with caution
   - red: High risk, likely overpriced or problematic

5. **Risk Factors:**
   - List specific concerns (e.g., "No original box", "High mileage", "Outdated model")
   - Leave empty if no significant risks

6. **Reasoning:**
   - Explain your evaluation in 2-3 sentences
   - Focus on WHY this is/isn't a good deal

**IMPORTANT:**
- Be conservative with scores
- If MSRP is unknown, estimate based on category norms
- If data is limited, reduce confidence score
- NEVER score obvious overpriced items above 50

Return ONLY valid JSON in this exact format:
{
  "score": 65,
  "confidence": 75,
  "fairValue": 450,
  "riskLevel": "green",
  "riskFactors": ["example risk"],
  "reasoning": "Your explanation here"
}`;
}

/**
 * Parse and validate DeepSeek response
 */
function parseDeepSeekResponse(content: string): DeepSeekClassification {
  try {
    // Try to extract JSON from markdown code blocks if present
    let jsonStr = content.trim();

    // Remove markdown code blocks
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (
      typeof parsed.score !== "number" ||
      typeof parsed.confidence !== "number" ||
      typeof parsed.fairValue !== "number" ||
      !["green", "amber", "red"].includes(parsed.riskLevel) ||
      typeof parsed.reasoning !== "string"
    ) {
      throw new Error("Invalid response structure");
    }

    // Apply optimism penalty if score is suspiciously high
    let adjustedScore = parsed.score;
    if (parsed.score > 85 && parsed.riskLevel !== "red") {
      adjustedScore = parsed.score * 0.85; // 15% penalty for over-optimism
    }

    return {
      score: Math.max(0, Math.min(100, adjustedScore)),
      confidence: Math.max(0, Math.min(100, parsed.confidence)),
      fairValue: Math.max(0, parsed.fairValue),
      riskLevel: parsed.riskLevel,
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse DeepSeek response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Call DeepSeek API with retry logic
 */
async function callDeepSeekAPI(
  prompt: string,
  config: DealEngineConfig,
  retries = 0
): Promise<{ response: DeepSeekResponse; latencyMs: number }> {
  const startTime = Date.now();

  try {
    const response = await axios.post<DeepSeekResponse>(
      config.deepseekApiUrl,
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a precise marketplace arbitrage analyst. Return ONLY valid JSON responses.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.deepseekApiKey}`,
        },
        timeout: config.llmTimeoutMs,
      }
    );

    const latencyMs = Date.now() - startTime;
    return { response: response.data, latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Retry logic
    if (retries < config.maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, config.retryDelayMs * (retries + 1)));
      return callDeepSeekAPI(prompt, config, retries + 1);
    }

    throw new Error(
      `DeepSeek API call failed after ${retries + 1} attempts: ${
        error instanceof Error ? error.message : "Unknown error"
      } (${latencyMs}ms)`
    );
  }
}

/**
 * Main DeepSeek classification function
 */
export async function classifyWithDeepSeek(
  listing: EnrichedListing,
  config: DealEngineConfig
): Promise<LLMClassification> {
  if (!config.deepseekApiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  try {
    // Build prompt
    const prompt = buildDeepSeekPrompt(listing);

    // Call API
    const { response, latencyMs } = await callDeepSeekAPI(prompt, config);

    // Parse response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from DeepSeek");
    }

    const classification = parseDeepSeekResponse(content);
    const tokensUsed = response.usage?.total_tokens;

    return {
      provider: "deepseek",
      score: classification.score,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      fairValueEstimate: classification.fairValue,
      riskLevel: classification.riskLevel,
      riskFactors: classification.riskFactors,
      latencyMs,
      tokensUsed,
    };
  } catch (error) {
    throw new Error(
      `DeepSeek classification failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
