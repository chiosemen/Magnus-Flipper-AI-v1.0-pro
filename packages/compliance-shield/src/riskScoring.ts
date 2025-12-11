/**
 * Risk Scoring System
 * Calculates marketplace risk scores based on multiple factors
 */

import { MarketplaceProfile, RiskLevel, JsChallengeRisk } from '@magnus-flipper-ai/marketplace-config';

export interface RiskScore {
  overall: number; // 0-100, higher = more risky
  factors: {
    riskLevel: number; // Based on riskLevel enum
    jsChallengeRisk: number; // Based on jsChallengeRisk
    throttleBudget: number; // Lower budget = higher risk
    antiBotRequirements: number; // More requirements = higher risk
    historicalBlockRate?: number; // Optional: historical data
  };
  recommendations: string[];
  complianceLevel: 'safe' | 'caution' | 'high-risk' | 'critical';
}

/**
 * Risk level to numeric score
 */
function riskLevelToScore(riskLevel: RiskLevel): number {
  switch (riskLevel) {
    case 'low':
      return 20;
    case 'medium':
      return 50;
    case 'high':
      return 75;
    case 'critical':
      return 95;
    default:
      return 50;
  }
}

/**
 * JS challenge risk to numeric score
 */
function jsChallengeRiskToScore(jsChallengeRisk: JsChallengeRisk): number {
  switch (jsChallengeRisk) {
    case 'none':
      return 0;
    case 'low':
      return 15;
    case 'medium':
      return 35;
    case 'high':
      return 60;
    default:
      return 0;
  }
}

/**
 * Calculate throttle budget risk score
 * Lower budget = higher risk (more restrictive)
 */
function throttleBudgetToScore(throttleBudget: number): number {
  if (throttleBudget === 0) return 0; // Unlimited = no risk
  if (throttleBudget < 1000) return 80; // Very restrictive
  if (throttleBudget < 5000) return 60; // Restrictive
  if (throttleBudget < 10000) return 40; // Moderate
  if (throttleBudget < 20000) return 20; // Permissive
  return 10; // Very permissive
}

/**
 * Calculate anti-bot requirements risk score
 * More requirements = higher risk (harder to scrape)
 */
function antiBotRequirementsToScore(profile: MarketplaceProfile): number {
  let score = 0;
  if (profile.requiresUserAgentRotation) score += 15;
  if (profile.requiresProxyRotation) score += 25;
  if (profile.requiresCookieSession) score += 20;
  return Math.min(score, 60); // Cap at 60
}

/**
 * Calculate overall risk score for a marketplace
 */
export function calculateRiskScore(
  profile: MarketplaceProfile,
  historicalBlockRate?: number
): RiskScore {
  const factors = {
    riskLevel: riskLevelToScore(profile.riskLevel),
    jsChallengeRisk: jsChallengeRiskToScore(profile.jsChallengeRisk),
    throttleBudget: throttleBudgetToScore(profile.throttleBudget),
    antiBotRequirements: antiBotRequirementsToScore(profile),
    historicalBlockRate: historicalBlockRate ? historicalBlockRate * 100 : undefined,
  };

  // Weighted average
  const weights = {
    riskLevel: 0.3,
    jsChallengeRisk: 0.25,
    throttleBudget: 0.2,
    antiBotRequirements: 0.15,
    historicalBlockRate: 0.1,
  };

  let overall = 
    factors.riskLevel * weights.riskLevel +
    factors.jsChallengeRisk * weights.jsChallengeRisk +
    factors.throttleBudget * weights.throttleBudget +
    factors.antiBotRequirements * weights.antiBotRequirements;

  if (factors.historicalBlockRate !== undefined) {
    overall += factors.historicalBlockRate * weights.historicalBlockRate;
  } else {
    // Redistribute weight if historical data not available
    overall = overall / (1 - weights.historicalBlockRate);
  }

  overall = Math.min(100, Math.max(0, overall));

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (overall >= 80) {
    recommendations.push('CRITICAL: Use maximum stealth mode');
    recommendations.push('Enable all anti-bot evasion features');
    recommendations.push('Monitor closely for blocks');
  } else if (overall >= 60) {
    recommendations.push('HIGH RISK: Use enhanced stealth mode');
    recommendations.push('Enable proxy rotation and session management');
    recommendations.push('Reduce request frequency');
  } else if (overall >= 40) {
    recommendations.push('MODERATE RISK: Use standard compliance measures');
    recommendations.push('Monitor for rate limits');
  } else {
    recommendations.push('LOW RISK: Standard scraping practices should suffice');
  }

  if (profile.requiresProxyRotation && !profile.requiresUserAgentRotation) {
    recommendations.push('Consider enabling user-agent rotation for better stealth');
  }

  if (profile.jsChallengeRisk === 'high') {
    recommendations.push('High JS challenge risk - ensure browser automation is properly configured');
  }

  // Determine compliance level
  let complianceLevel: 'safe' | 'caution' | 'high-risk' | 'critical';
  if (overall >= 80) {
    complianceLevel = 'critical';
  } else if (overall >= 60) {
    complianceLevel = 'high-risk';
  } else if (overall >= 40) {
    complianceLevel = 'caution';
  } else {
    complianceLevel = 'safe';
  }

  return {
    overall: Math.round(overall * 100) / 100,
    factors,
    recommendations,
    complianceLevel,
  };
}

/**
 * Compare risk scores between marketplaces
 */
export function compareRiskScores(
  scores: Array<{ marketplace: string; score: RiskScore }>
): Array<{ marketplace: string; score: RiskScore; rank: number }> {
  return scores
    .sort((a, b) => b.score.overall - a.score.overall)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}
