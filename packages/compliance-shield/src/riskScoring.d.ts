/**
 * Risk Scoring System
 * Calculates marketplace risk scores based on multiple factors
 */
import { MarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
export interface RiskScore {
    overall: number;
    factors: {
        riskLevel: number;
        jsChallengeRisk: number;
        throttleBudget: number;
        antiBotRequirements: number;
        historicalBlockRate?: number;
    };
    recommendations: string[];
    complianceLevel: 'safe' | 'caution' | 'high-risk' | 'critical';
}
/**
 * Calculate overall risk score for a marketplace
 */
export declare function calculateRiskScore(profile: MarketplaceProfile, historicalBlockRate?: number): RiskScore;
/**
 * Compare risk scores between marketplaces
 */
export declare function compareRiskScores(scores: Array<{
    marketplace: string;
    score: RiskScore;
}>): Array<{
    marketplace: string;
    score: RiskScore;
    rank: number;
}>;
//# sourceMappingURL=riskScoring.d.ts.map