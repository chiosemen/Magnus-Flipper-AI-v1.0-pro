import axios from "axios";
import type { EnrichedListing } from "../types/Listing.js";
import type { LLMClassification } from "../types/DealScore.js";
import type { DealEngineConfig } from "../config.js";

/**
 * OpenAI o1/GPT-4 Deal Classifier
 * Backup classifier with faster, more decisive analysis
 */

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

function buildOpenAIPrompt(listing: EnrichedListing): string {
  const msrpText = listing.msrp ? `MSRP: $${listing.msrp}` : "MSRP: Unknown";

  return `Evaluate this marketplace listing for resale arbitrage potential.

Listing: ${listing.title}
Price: $${listing.price}
${msrpText}
Condition: ${listing.condition}
Category: ${listing.category || "Unknown"}

Provide a concise JSON response:
{
  "score": 0-100,
  "confidence": 0-100,
  "fairValue": estimated_fair_market_value,
  "riskLevel": "green|amber|red",
  "riskFactors": ["list of specific risks or empty array"],
  "reasoning": "brief 1-2 sentence explanation"
}

Be conservative with scores. Only exceptional deals score 80+.`;
}

function parseOpenAIResponse(content: string) {
  try {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error instanceof Error ? error.message : "Unknown"}`);
  }
}

export async function classifyWithOpenAI(
  listing: EnrichedListing,
  config: DealEngineConfig
): Promise<LLMClassification> {
  if (!config.openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const startTime = Date.now();

  try {
    const response = await axios.post<OpenAIResponse>(
      "https://api.openai.com/v1/chat/completions",
      {
        model: config.openaiModel,
        messages: [
          {
            role: "system",
            content: "You are a marketplace arbitrage expert. Return only valid JSON responses.",
          },
          {
            role: "user",
            content: buildOpenAIPrompt(listing),
          },
        ],
        temperature: 0.5,
        max_tokens: 800,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        timeout: config.llmTimeoutMs,
      }
    );

    const latencyMs = Date.now() - startTime;
    const content = response.data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty OpenAI response");
    }

    const parsed = parseOpenAIResponse(content);

    return {
      provider: "openai",
      score: Math.max(0, Math.min(100, parsed.score)),
      confidence: Math.max(0, Math.min(100, parsed.confidence)),
      reasoning: parsed.reasoning,
      fairValueEstimate: Math.max(0, parsed.fairValue),
      riskLevel: parsed.riskLevel,
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      latencyMs,
      tokensUsed: response.data.usage?.total_tokens,
    };
  } catch (error) {
    throw new Error(
      `OpenAI classification failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
