/**
 * Worker Simulation Tests
 * Tests worker behavior without actual scraping
 * 
 * Usage: pnpm test:workers
 */

import { describe, it, expect, jest } from '@jest/globals';
import { getMarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
import { validateCompliance, getComplianceConstraints } from '@magnus-flipper-ai/compliance-shield';
import { calculateRiskScore } from '@magnus-flipper-ai/compliance-shield/riskScoring';
import { getGuardrails, applyGuardrails } from '@magnus-flipper-ai/compliance-shield/guardrails';
import { tryConsume, getCurrentBackoffSeconds } from '@magnus-flipper-ai/rate-limiter';

describe('Worker Simulation Tests', () => {
  describe('1. Marketplace Profile Validation', () => {
    it('should load all marketplace profiles', async () => {
      const marketplaces = ['facebook', 'craigslist', 'ebay', 'vinted', 'gumtree', 'offerup'];
      
      for (const marketplace of marketplaces) {
        const profile = getMarketplaceProfile(marketplace);
        expect(profile).toHaveProperty('id');
        expect(profile).toHaveProperty('displayName');
        expect(profile).toHaveProperty('riskLevel');
        expect(profile).toHaveProperty('throttleBudget');
        expect(profile.id).toBe(marketplace);
      }
    });

    it('should validate profile risk levels', () => {
      const profile = getMarketplaceProfile('facebook');
      expect(['low', 'medium', 'high', 'critical']).toContain(profile.riskLevel);
      expect(profile.riskLevel).toBe('high');
    });

    it('should validate throttle budgets', () => {
      const profile = getMarketplaceProfile('facebook');
      expect(profile.throttleBudget).toBeGreaterThan(0);
      expect(typeof profile.throttleBudget).toBe('number');
    });
  });

  describe('2. Compliance Validation', () => {
    it('should validate compliance for low request count', () => {
      const profile = getMarketplaceProfile('facebook');
      const result = validateCompliance(profile, 100, true, true);
      
      expect(result.compliant).toBe(true);
    });

    it('should reject compliance for exceeded daily limit', () => {
      const profile = getMarketplaceProfile('facebook');
      const constraints = getComplianceConstraints(profile);
      const result = validateCompliance(
        profile,
        constraints.maxRequestsPerDay + 1,
        true,
        true
      );
      
      expect(result.compliant).toBe(false);
      expect(result.reason).toContain('Daily request limit exceeded');
    });

    it('should reject compliance when proxy required but missing', () => {
      const profile = getMarketplaceProfile('facebook');
      const result = validateCompliance(profile, 100, false, true);
      
      expect(result.compliant).toBe(false);
      expect(result.reason).toContain('Proxy required');
    });

    it('should reject compliance when session required but missing', () => {
      const profile = getMarketplaceProfile('facebook');
      const result = validateCompliance(profile, 100, true, false);
      
      expect(result.compliant).toBe(false);
      expect(result.reason).toContain('Session/cookies required');
    });
  });

  describe('3. Risk Scoring', () => {
    it('should calculate risk scores for all marketplaces', () => {
      const marketplaces = ['facebook', 'craigslist', 'ebay'];
      
      for (const marketplace of marketplaces) {
        const profile = getMarketplaceProfile(marketplace);
        const score = calculateRiskScore(profile);
        
        expect(score.overall).toBeGreaterThanOrEqual(0);
        expect(score.overall).toBeLessThanOrEqual(100);
        expect(score).toHaveProperty('factors');
        expect(score).toHaveProperty('recommendations');
        expect(score).toHaveProperty('complianceLevel');
        expect(['safe', 'caution', 'high-risk', 'critical']).toContain(score.complianceLevel);
      }
    });

    it('should rank marketplaces by risk', () => {
      const facebook = calculateRiskScore(getMarketplaceProfile('facebook'));
      const craigslist = calculateRiskScore(getMarketplaceProfile('craigslist'));
      
      expect(facebook.overall).toBeGreaterThan(craigslist.overall);
      expect(facebook.complianceLevel).toBe('critical');
      expect(craigslist.complianceLevel).toBe('safe');
    });
  });

  describe('4. Guardrails Enforcement', () => {
    it('should apply guardrails to throttle multiplier', () => {
      const profile = getMarketplaceProfile('facebook');
      const guardrails = getGuardrails(profile);
      
      // Test min bound
      const resultMin = applyGuardrails(profile, 0.1, 0.8, false);
      expect(resultMin.multiplier).toBeGreaterThanOrEqual(guardrails.minMultiplier);
      
      // Test max bound
      const resultMax = applyGuardrails(profile, 2.0, 0.95, false);
      expect(resultMax.multiplier).toBeLessThanOrEqual(guardrails.maxMultiplier);
      
      // Test emergency mode
      const resultEmergency = applyGuardrails(profile, 1.0, 0.5, false);
      expect(resultEmergency.emergencyMode).toBe(true);
      expect(resultEmergency.multiplier).toBe(guardrails.emergencyMultiplier);
    });

    it('should trigger emergency mode on low success rate', () => {
      const profile = getMarketplaceProfile('facebook');
      const guardrails = getGuardrails(profile);
      
      const result = applyGuardrails(profile, 1.0, guardrails.emergencyThreshold - 0.1, false);
      
      expect(result.emergencyMode).toBe(true);
      expect(result.multiplier).toBe(guardrails.emergencyMultiplier);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should recover from emergency mode on high success rate', () => {
      const profile = getMarketplaceProfile('facebook');
      const guardrails = getGuardrails(profile);
      
      const result = applyGuardrails(profile, 0.2, guardrails.recoveryThreshold + 0.1, true);
      
      expect(result.emergencyMode).toBe(false);
    });
  });

  describe('5. Rate Limiting Simulation', () => {
    it('should check rate limit consumption', async () => {
      const result = await tryConsume({
        marketplace: 'facebook',
        ip: undefined,
        tier: 'STARTER',
      });
      
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('resetAt');
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.remaining).toBe('number');
    });

    it('should calculate backoff seconds', async () => {
      const backoff = await getCurrentBackoffSeconds({
        marketplace: 'facebook',
        ip: undefined,
        tier: 'STARTER',
      });
      
      expect(backoff).toBeGreaterThan(0);
      expect(typeof backoff).toBe('number');
    });
  });

  describe('6. Worker Scheduling Logic', () => {
    it('should prioritize high-risk marketplaces correctly', () => {
      const marketplaces = ['facebook', 'craigslist', 'ebay'];
      const profiles = marketplaces.map((m) => getMarketplaceProfile(m));
      const scores = profiles.map((p) => calculateRiskScore(p));
      
      // Sort by risk score (descending)
      const sorted = [...scores].sort((a, b) => b.overall - a.overall);
      
      // Facebook should be highest risk
      expect(sorted[0].overall).toBeGreaterThan(sorted[1].overall);
    });

    it('should respect throttle budgets', () => {
      const profile = getMarketplaceProfile('facebook');
      const constraints = getComplianceConstraints(profile);
      
      // Simulate daily request tracking
      let dailyCount = 0;
      const maxRequests = constraints.maxRequestsPerDay;
      
      while (dailyCount < maxRequests) {
        const compliance = validateCompliance(profile, dailyCount, true, true);
        expect(compliance.compliant).toBe(true);
        dailyCount += 100;
      }
      
      // Should fail at limit
      const finalCompliance = validateCompliance(profile, dailyCount, true, true);
      expect(finalCompliance.compliant).toBe(false);
    });
  });

  describe('7. Adaptive Throttling Simulation', () => {
    it('should adjust multiplier based on success rate', async () => {
      const profile = getMarketplaceProfile('facebook');
      const guardrails = getGuardrails(profile);
      
      // High success rate should allow increase
      const resultHigh = applyGuardrails(profile, 1.2, 0.95, false);
      expect(resultHigh.multiplier).toBeLessThanOrEqual(guardrails.maxMultiplier);
      
      // Low success rate should trigger emergency
      const resultLow = applyGuardrails(profile, 1.0, 0.5, false);
      expect(resultLow.emergencyMode).toBe(true);
      expect(resultLow.multiplier).toBe(guardrails.emergencyMultiplier);
    });
  });
});
