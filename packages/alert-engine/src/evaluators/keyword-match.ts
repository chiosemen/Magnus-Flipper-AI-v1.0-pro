/**
 * Keyword Match Alert Evaluator
 * Evaluates if a listing title/description contains specific keywords
 */

import type {
  KeywordMatchConditions,
  ListingToEvaluate,
  EvaluationResult,
} from "../types";

/**
 * Evaluate keyword match condition
 */
export function evaluateKeywordMatch(
  conditions: KeywordMatchConditions,
  listing: ListingToEvaluate
): EvaluationResult {
  const { keywords, match_type, case_sensitive, exact_match } = conditions;

  if (!keywords || keywords.length === 0) {
    return {
      triggered: false,
      trigger_reason: "No keywords defined",
    };
  }

  const listingText = listing.title || "";
  const normalizedListingText = case_sensitive
    ? listingText
    : listingText.toLowerCase();

  // Track which keywords matched
  const matchedKeywords: string[] = [];

  for (const keyword of keywords) {
    const normalizedKeyword = case_sensitive
      ? keyword
      : keyword.toLowerCase();

    let matches = false;

    if (exact_match) {
      // Exact word boundary match
      const wordBoundaryRegex = new RegExp(
        `\\b${escapeRegex(normalizedKeyword)}\\b`,
        case_sensitive ? "" : "i"
      );
      matches = wordBoundaryRegex.test(listingText);
    } else {
      // Substring match
      matches = normalizedListingText.includes(normalizedKeyword);
    }

    if (matches) {
      matchedKeywords.push(keyword);
    }
  }

  // Evaluate match type
  let triggered = false;

  if (match_type === "any") {
    triggered = matchedKeywords.length > 0;
  } else if (match_type === "all") {
    triggered = matchedKeywords.length === keywords.length;
  }

  if (!triggered) {
    return {
      triggered: false,
      trigger_reason: `No keywords matched (requires ${match_type} of: ${keywords.join(
        ", "
      )})`,
    };
  }

  // Alert triggered!
  return {
    triggered: true,
    trigger_reason: `Matched keywords: ${matchedKeywords.join(", ")}`,
    matched_listing: listing,
    metadata: {
      matched_keywords: matchedKeywords,
      total_keywords: keywords.length,
      match_type,
      title: listing.title,
    },
  };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
