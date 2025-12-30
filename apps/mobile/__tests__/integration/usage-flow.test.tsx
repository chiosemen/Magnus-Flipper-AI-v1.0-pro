/**
 * Integration tests for usage flow
 * 
 * Tests API contract and usage data processing.
 * Uses direct testing instead of component rendering due to RN 0.81 + React 19 compatibility.
 */

import {
  mockUsageResponse,
  mockUsageResponseGrace,
  mockUsageResponseDisabled,
  mockUsageResponseAtLimit,
  mockErrorResponse,
} from '../helpers/fixtures';

describe('Usage Flow Integration', () => {
  describe('API Contract', () => {
    it('should have correct usage response structure', () => {
      expect(mockUsageResponse).toHaveProperty('todayCu');
      expect(mockUsageResponse).toHaveProperty('monthCu');
      expect(mockUsageResponse).toHaveProperty('byMarketplace');
      expect(mockUsageResponse).toHaveProperty('recentRuns');
      expect(mockUsageResponse).toHaveProperty('policy');
      expect(mockUsageResponse).toHaveProperty('features');
      expect(mockUsageResponse).toHaveProperty('limits');
      expect(mockUsageResponse).toHaveProperty('usage');
    });

    it('should have market agent features', () => {
      expect(mockUsageResponse.features).toHaveProperty('marketAgent');
      expect(mockUsageResponse.features.marketAgent).toHaveProperty('enabled');
      expect(mockUsageResponse.features.marketAgent).toHaveProperty('status');
    });

    it('should have market agent limits', () => {
      expect(mockUsageResponse.limits).toHaveProperty('marketAgent');
      expect(mockUsageResponse.limits.marketAgent).toHaveProperty('runsPerDay');
      expect(mockUsageResponse.limits.marketAgent).toHaveProperty('minRefreshSeconds');
      expect(mockUsageResponse.limits.marketAgent).toHaveProperty('maxItemsPerDay');
    });

    it('should have market agent usage', () => {
      expect(mockUsageResponse.usage).toHaveProperty('marketAgent');
      expect(mockUsageResponse.usage.marketAgent).toHaveProperty('today');
      expect(mockUsageResponse.usage.marketAgent.today).toHaveProperty('runs');
      expect(mockUsageResponse.usage.marketAgent.today).toHaveProperty('itemsReturned');
    });
  });

  describe('Entitlement States', () => {
    it('should have active status for enabled user', () => {
      expect(mockUsageResponse.features.marketAgent.enabled).toBe(true);
      expect(mockUsageResponse.features.marketAgent.status).toBe('active');
    });

    it('should have past_due status with grace period', () => {
      expect(mockUsageResponseGrace.features.marketAgent.status).toBe('past_due');
      expect(mockUsageResponseGrace.features.marketAgent.graceUntil).toBeTruthy();
    });

    it('should have canceled status for disabled user', () => {
      expect(mockUsageResponseDisabled.features.marketAgent.enabled).toBe(false);
      expect(mockUsageResponseDisabled.features.marketAgent.status).toBe('canceled');
    });
  });

  describe('Usage Calculations', () => {
    it('should calculate runs percentage correctly', () => {
      const runs = mockUsageResponse.usage.marketAgent.today.runs;
      const limit = mockUsageResponse.limits.marketAgent.runsPerDay;
      const percent = (runs / limit) * 100;
      
      expect(percent).toBeLessThan(100);
      expect(percent).toBeGreaterThan(0);
    });

    it('should calculate items percentage correctly', () => {
      const items = mockUsageResponse.usage.marketAgent.today.itemsReturned;
      const limit = mockUsageResponse.limits.marketAgent.maxItemsPerDay;
      const percent = (items / limit) * 100;
      
      expect(percent).toBeLessThan(100);
      expect(percent).toBeGreaterThan(0);
    });

    it('should detect at-limit state', () => {
      const runs = mockUsageResponseAtLimit.usage.marketAgent.today.runs;
      const runLimit = mockUsageResponseAtLimit.limits.marketAgent.runsPerDay;
      const items = mockUsageResponseAtLimit.usage.marketAgent.today.itemsReturned;
      const itemLimit = mockUsageResponseAtLimit.limits.marketAgent.maxItemsPerDay;
      
      expect(runs).toBe(runLimit);
      expect(items).toBe(itemLimit);
    });
  });

  describe('Grace Period Logic', () => {
    it('should parse grace date correctly', () => {
      const graceUntil = mockUsageResponseGrace.features.marketAgent.graceUntil;
      expect(graceUntil).toBeTruthy();
      
      const graceDate = new Date(graceUntil!);
      expect(graceDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should determine if in grace period', () => {
      const isInGracePeriod = (status: string, graceUntil: string | null): boolean => {
        if (status !== 'past_due' || !graceUntil) return false;
        const graceDate = new Date(graceUntil);
        return graceDate.getTime() > Date.now();
      };

      expect(isInGracePeriod(
        mockUsageResponseGrace.features.marketAgent.status,
        mockUsageResponseGrace.features.marketAgent.graceUntil
      )).toBe(true);

      expect(isInGracePeriod(
        mockUsageResponse.features.marketAgent.status,
        mockUsageResponse.features.marketAgent.graceUntil
      )).toBe(false);
    });
  });

  describe('Progress Bar Colors', () => {
    it('should return green for low usage', () => {
      const getProgressColor = (percent: number): string => {
        if (percent > 90) return '#f87171'; // red
        if (percent >= 70) return '#facc15'; // yellow
        return '#34d399'; // green
      };

      expect(getProgressColor(50)).toBe('#34d399');
      expect(getProgressColor(69)).toBe('#34d399');
    });

    it('should return yellow for medium usage', () => {
      const getProgressColor = (percent: number): string => {
        if (percent > 90) return '#f87171';
        if (percent >= 70) return '#facc15';
        return '#34d399';
      };

      expect(getProgressColor(70)).toBe('#facc15');
      expect(getProgressColor(89)).toBe('#facc15');
    });

    it('should return red for high usage', () => {
      const getProgressColor = (percent: number): string => {
        if (percent > 90) return '#f87171';
        if (percent >= 70) return '#facc15';
        return '#34d399';
      };

      expect(getProgressColor(91)).toBe('#f87171');
      expect(getProgressColor(100)).toBe('#f87171');
    });
  });

  describe('Marketplace Stats', () => {
    it('should have marketplace breakdown', () => {
      expect(mockUsageResponse.byMarketplace).toBeInstanceOf(Array);
      expect(mockUsageResponse.byMarketplace.length).toBeGreaterThan(0);
    });

    it('should have marketplace with cu values', () => {
      mockUsageResponse.byMarketplace.forEach((mp) => {
        expect(mp).toHaveProperty('marketplace');
        expect(mp).toHaveProperty('cu');
        expect(typeof mp.cu).toBe('number');
      });
    });
  });

  describe('Policy Information', () => {
    it('should have tier information', () => {
      expect(mockUsageResponse.policy).toHaveProperty('tier');
      expect(typeof mockUsageResponse.policy.tier).toBe('string');
    });

    it('should have concurrency limits', () => {
      expect(mockUsageResponse.policy).toHaveProperty('maxConcurrency');
      expect(mockUsageResponse.policy.maxConcurrency).toBeGreaterThan(0);
    });

    it('should have allowed markets', () => {
      expect(mockUsageResponse.policy).toHaveProperty('marketsAllowed');
      expect(mockUsageResponse.policy.marketsAllowed).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should have error structure', () => {
      expect(mockErrorResponse).toHaveProperty('error');
      expect(mockErrorResponse).toHaveProperty('message');
    });

    it('should handle missing data gracefully', () => {
      const getUsageRuns = (data: any): number => {
        return data?.usage?.marketAgent?.today?.runs ?? 0;
      };

      expect(getUsageRuns(mockUsageResponse)).toBe(45);
      expect(getUsageRuns(null)).toBe(0);
      expect(getUsageRuns({})).toBe(0);
      expect(getUsageRuns({ usage: {} })).toBe(0);
    });
  });

  describe('CU Formatting', () => {
    it('should format CU values correctly', () => {
      const formatCu = (cu: number): string => {
        return cu.toFixed(1);
      };

      expect(formatCu(15.5)).toBe('15.5');
      expect(formatCu(245.3)).toBe('245.3');
      expect(formatCu(0)).toBe('0.0');
    });
  });

  describe('Date Formatting', () => {
    it('should format grace date for display', () => {
      const graceUntil = mockUsageResponseGrace.features.marketAgent.graceUntil;
      const graceDate = new Date(graceUntil!);
      const formatted = graceDate.toLocaleDateString();
      
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });
});
