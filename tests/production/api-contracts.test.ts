/**
 * API Contract Tests
 * Validates API contracts match expected schemas
 * 
 * Usage: pnpm test:contracts
 */

import { describe, it, expect } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:4000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

interface FeedResponse {
  listings: Array<{
    id: string;
    title: string;
    price: number;
    marketplace: string;
    firstSeen: string;
    lastSeen: string;
    description?: string;
    imageUrl?: string;
    location?: string;
    rankingScore?: {
      overall: number;
      velocity: number;
      freshness: number;
      price: number;
      engagement: number;
    };
  }>;
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
  metadata: {
    marketplaces: string[];
    deduplicated: boolean;
    ranked: boolean;
  };
}

interface RiskScoreResponse {
  marketplaces: Array<{
    marketplace: string;
    score: {
      overall: number;
      factors: {
        riskLevel: number;
        jsChallengeRisk: number;
        throttleBudget: number;
        antiBotRequirements: number;
      };
      recommendations: string[];
      complianceLevel: 'safe' | 'caution' | 'high-risk' | 'critical';
    };
    rank: number;
  }>;
  summary: {
    total: number;
    critical: number;
    highRisk: number;
    caution: number;
    safe: number;
  };
  timestamp: string;
}

describe('API Contract Tests', () => {
  describe('Feed API Contract', () => {
    it('should match FeedResponse schema', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`);
      expect(response.status).toBe(200);
      
      const data: FeedResponse = await response.json();
      
      // Validate structure
      expect(data).toHaveProperty('listings');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metadata');
      
      // Validate listings array
      expect(Array.isArray(data.listings)).toBe(true);
      
      if (data.listings.length > 0) {
        const listing = data.listings[0];
        expect(listing).toHaveProperty('id');
        expect(listing).toHaveProperty('title');
        expect(listing).toHaveProperty('price');
        expect(listing).toHaveProperty('marketplace');
        expect(listing).toHaveProperty('firstSeen');
        expect(listing).toHaveProperty('lastSeen');
        
        // Type checks
        expect(typeof listing.id).toBe('string');
        expect(typeof listing.title).toBe('string');
        expect(typeof listing.price).toBe('number');
        expect(typeof listing.marketplace).toBe('string');
      }
      
      // Validate pagination
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('hasMore');
      expect(typeof data.pagination.limit).toBe('number');
      expect(typeof data.pagination.hasMore).toBe('boolean');
      
      // Validate metadata
      expect(data.metadata).toHaveProperty('marketplaces');
      expect(data.metadata).toHaveProperty('deduplicated');
      expect(data.metadata).toHaveProperty('ranked');
      expect(Array.isArray(data.metadata.marketplaces)).toBe(true);
    });

    it('should validate pagination cursor format', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=5`);
      const data: FeedResponse = await response.json();
      
      if (data.pagination.nextCursor) {
        // Cursor should be base64 decodable
        try {
          const decoded = Buffer.from(data.pagination.nextCursor, 'base64').toString('utf-8');
          const cursorData = JSON.parse(decoded);
          expect(cursorData).toHaveProperty('offset');
          expect(cursorData).toHaveProperty('lastId');
        } catch (error) {
          throw new Error(`Invalid cursor format: ${data.pagination.nextCursor}`);
        }
      }
    });

    it('should validate price filters', async () => {
      const response = await fetch(
        `${WEB_URL}/api/search/feed?minPrice=100&maxPrice=500&limit=10`
      );
      const data: FeedResponse = await response.json();
      
      // All listings should be within price range
      data.listings.forEach((listing) => {
        expect(listing.price).toBeGreaterThanOrEqual(100);
        expect(listing.price).toBeLessThanOrEqual(500);
      });
    });
  });

  describe('Compliance API Contract', () => {
    it('should match RiskScoreResponse schema', async () => {
      const response = await fetch(`${WEB_URL}/api/compliance/risk-scores`);
      expect(response.status).toBe(200);
      
      const data: RiskScoreResponse = await response.json();
      
      // Validate structure
      expect(data).toHaveProperty('marketplaces');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('timestamp');
      
      // Validate marketplaces array
      expect(Array.isArray(data.marketplaces)).toBe(true);
      
      if (data.marketplaces.length > 0) {
        const item = data.marketplaces[0];
        expect(item).toHaveProperty('marketplace');
        expect(item).toHaveProperty('score');
        expect(item).toHaveProperty('rank');
        
        // Validate score structure
        expect(item.score).toHaveProperty('overall');
        expect(item.score).toHaveProperty('factors');
        expect(item.score).toHaveProperty('recommendations');
        expect(item.score).toHaveProperty('complianceLevel');
        
        // Validate factors
        expect(item.score.factors).toHaveProperty('riskLevel');
        expect(item.score.factors).toHaveProperty('jsChallengeRisk');
        expect(item.score.factors).toHaveProperty('throttleBudget');
        expect(item.score.factors).toHaveProperty('antiBotRequirements');
        
        // Validate compliance level
        expect(['safe', 'caution', 'high-risk', 'critical']).toContain(
          item.score.complianceLevel
        );
        
        // Validate score ranges
        expect(item.score.overall).toBeGreaterThanOrEqual(0);
        expect(item.score.overall).toBeLessThanOrEqual(100);
      }
      
      // Validate summary
      expect(data.summary).toHaveProperty('total');
      expect(data.summary).toHaveProperty('critical');
      expect(data.summary).toHaveProperty('highRisk');
      expect(data.summary).toHaveProperty('caution');
      expect(data.summary).toHaveProperty('safe');
      
      // Validate timestamp
      expect(() => new Date(data.timestamp)).not.toThrow();
    });

    it('should validate guardrails response', async () => {
      const response = await fetch(
        `${WEB_URL}/api/compliance/guardrails?marketplace=facebook`
      );
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('marketplace');
      expect(data).toHaveProperty('guardrails');
      expect(data).toHaveProperty('profile');
      
      // Validate guardrails structure
      const guardrails = data.guardrails;
      expect(guardrails).toHaveProperty('minMultiplier');
      expect(guardrails).toHaveProperty('maxMultiplier');
      expect(guardrails).toHaveProperty('emergencyThreshold');
      expect(guardrails).toHaveProperty('emergencyMultiplier');
      expect(guardrails).toHaveProperty('recoveryThreshold');
      expect(guardrails).toHaveProperty('cooldownPeriod');
      
      // Validate ranges
      expect(guardrails.minMultiplier).toBeGreaterThan(0);
      expect(guardrails.maxMultiplier).toBeGreaterThan(guardrails.minMultiplier);
      expect(guardrails.emergencyThreshold).toBeGreaterThan(0);
      expect(guardrails.emergencyThreshold).toBeLessThan(1);
      expect(guardrails.recoveryThreshold).toBeGreaterThan(guardrails.emergencyThreshold);
      expect(guardrails.recoveryThreshold).toBeLessThanOrEqual(1);
    });
  });

  describe('Health API Contract', () => {
    it('should match health response schema', async () => {
      const response = await fetch(`${API_URL}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      
      expect(data.status).toBe('ok');
      expect(typeof data.uptime).toBe('number');
      expect(() => new Date(data.timestamp)).not.toThrow();
    });

    it('should match readiness response schema', async () => {
      const response = await fetch(`${API_URL}/health/readiness`);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('checks');
      
      if (response.status === 200) {
        expect(data.checks).toHaveProperty('database');
        expect(typeof data.checks.database).toBe('boolean');
      }
    });
  });

  describe('Error Response Contract', () => {
    it('should return consistent error format', async () => {
      // Test with invalid endpoint
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=invalid`);
      
      // Should either return 200 with valid data or 400/500 with error
      if (response.status >= 400) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
      }
    });

    it('should handle missing parameters gracefully', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('listings');
      expect(data).toHaveProperty('pagination');
    });
  });
});
