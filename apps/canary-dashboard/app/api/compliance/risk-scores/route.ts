import { NextResponse } from 'next/server';
import { getMarketplaceProfile, MARKETPLACE_PROFILES } from '@magnus-flipper-ai/marketplace-config';
import { calculateRiskScore, compareRiskScores } from '@magnus-flipper-ai/compliance-shield/riskScoring';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/compliance/risk-scores
 * Returns risk scores for all marketplaces
 */
export async function GET() {
  try {
    const scores = Object.keys(MARKETPLACE_PROFILES).map((marketplaceId) => {
      const profile = getMarketplaceProfile(marketplaceId);
      const score = calculateRiskScore(profile);
      return {
        marketplace: marketplaceId,
        score,
      };
    });

    const ranked = compareRiskScores(scores);

    return NextResponse.json({
      marketplaces: ranked,
      summary: {
        total: ranked.length,
        critical: ranked.filter((r) => r.score.complianceLevel === 'critical').length,
        highRisk: ranked.filter((r) => r.score.complianceLevel === 'high-risk').length,
        caution: ranked.filter((r) => r.score.complianceLevel === 'caution').length,
        safe: ranked.filter((r) => r.score.complianceLevel === 'safe').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching risk scores:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch risk scores',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
