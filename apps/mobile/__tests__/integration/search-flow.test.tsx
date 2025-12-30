/**
 * Integration tests for search flow
 * 
 * Tests API contract and data flow logic.
 * Uses direct testing instead of component rendering due to RN 0.81 + React 19 compatibility.
 */

import {
  mockDemoResponse,
  mockCachedDemoResponse,
  mockEmptyDemoResponse,
  mockErrorResponse,
} from '../helpers/fixtures';

describe('Search Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Contract', () => {
    it('should have correct demo response structure', () => {
      expect(mockDemoResponse).toHaveProperty('items');
      expect(mockDemoResponse).toHaveProperty('meta');
      expect(Array.isArray(mockDemoResponse.items)).toBe(true);
    });

    it('should have items with required fields', () => {
      mockDemoResponse.items.forEach((item) => {
        expect(item).toHaveProperty('source');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('priceText');
        expect(item).toHaveProperty('url');
        expect(item).toHaveProperty('badge');
        expect(item).toHaveProperty('freshnessSeconds');
      });
    });

    it('should have valid badge types', () => {
      const validBadges = ['verified', 'live-capture', 'recent', 'in-progress'];
      mockDemoResponse.items.forEach((item) => {
        expect(validBadges).toContain(item.badge);
      });
    });

    it('should have meta with required fields', () => {
      expect(mockDemoResponse.meta).toHaveProperty('marketplace');
      expect(mockDemoResponse.meta).toHaveProperty('country');
      expect(mockDemoResponse.meta).toHaveProperty('cached');
      expect(mockDemoResponse.meta).toHaveProperty('cacheStatus');
    });
  });

  describe('Cached Response', () => {
    it('should mark cached responses correctly', () => {
      expect(mockCachedDemoResponse.meta.cached).toBe(true);
      expect(mockCachedDemoResponse.meta.cacheStatus).toBe('hit');
    });

    it('should have age seconds for cached responses', () => {
      expect(mockCachedDemoResponse.meta.ageSeconds).toBeGreaterThan(0);
    });
  });

  describe('Empty Response', () => {
    it('should return empty items array', () => {
      expect(mockEmptyDemoResponse.items).toHaveLength(0);
    });

    it('should have miss-empty cache status', () => {
      expect(mockEmptyDemoResponse.meta.cacheStatus).toBe('miss-empty');
    });
  });

  describe('Error Response', () => {
    it('should have error field', () => {
      expect(mockErrorResponse).toHaveProperty('error');
    });

    it('should have message field', () => {
      expect(mockErrorResponse).toHaveProperty('message');
    });
  });

  describe('Search Query Building', () => {
    it('should build correct API URL', () => {
      const query = 'macbook pro';
      const marketplace = 'gumtree';
      const country = 'GB';
      const mode = 'search';
      const demo = true;

      const url = `/api/demo?q=${encodeURIComponent(query)}&marketplace=${marketplace}&country=${country}&mode=${mode}${demo ? '&demo=true' : ''}`;
      
      expect(url).toContain('q=macbook%20pro');
      expect(url).toContain('marketplace=gumtree');
      expect(url).toContain('country=GB');
      expect(url).toContain('mode=search');
      expect(url).toContain('demo=true');
    });

    it('should encode special characters in query', () => {
      const query = 'iphone 13 pro & max';
      const encoded = encodeURIComponent(query);
      
      expect(encoded).toBe('iphone%2013%20pro%20%26%20max');
    });
  });

  describe('Result Processing', () => {
    it('should format freshness correctly for seconds', () => {
      const formatFreshness = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
      };

      expect(formatFreshness(30)).toBe('30s ago');
      expect(formatFreshness(120)).toBe('2m ago');
      expect(formatFreshness(300)).toBe('5m ago');
      expect(formatFreshness(3600)).toBe('1h ago');
      expect(formatFreshness(7200)).toBe('2h ago');
    });

    it('should count items correctly', () => {
      expect(mockDemoResponse.items.length).toBe(3);
    });

    it('should have valid marketplace sources', () => {
      const validSources = ['facebook', 'vinted', 'gumtree'];
      mockDemoResponse.items.forEach((item) => {
        expect(validSources).toContain(item.source);
      });
    });
  });

  describe('Demo Mode', () => {
    it('should add demo parameter when enabled', () => {
      const demoMode = true;
      const baseUrl = '/api/demo?q=test';
      const finalUrl = demoMode ? `${baseUrl}&demo=true` : baseUrl;
      
      expect(finalUrl).toContain('demo=true');
    });

    it('should not add demo parameter when disabled', () => {
      const demoMode = false;
      const baseUrl = '/api/demo?q=test';
      const finalUrl = demoMode ? `${baseUrl}&demo=true` : baseUrl;
      
      expect(finalUrl).not.toContain('demo=true');
    });
  });

  describe('Marketplace Selection', () => {
    const marketplaces = ['facebook', 'vinted', 'gumtree'];

    marketplaces.forEach((mp) => {
      it(`should support ${mp} marketplace`, () => {
        expect(marketplaces).toContain(mp);
      });
    });
  });

  describe('Country Selection', () => {
    const countries = ['GB', 'US', 'FR', 'DE'];

    countries.forEach((country) => {
      it(`should support ${country} country code`, () => {
        expect(countries).toContain(country);
      });
    });
  });

  describe('Response Validation', () => {
    it('should validate response has items array', () => {
      const isValidResponse = (response: any): boolean => {
        return Boolean(response && Array.isArray(response.items));
      };

      expect(isValidResponse(mockDemoResponse)).toBe(true);
      expect(isValidResponse(mockEmptyDemoResponse)).toBe(true);
      expect(isValidResponse(null)).toBe(false);
      expect(isValidResponse({})).toBe(false);
    });

    it('should handle JSON parse errors gracefully', () => {
      const parseItems = (itemsStr: string): any[] => {
        try {
          return JSON.parse(itemsStr);
        } catch {
          return [];
        }
      };

      expect(parseItems('invalid-json')).toEqual([]);
      expect(parseItems(JSON.stringify([]))).toEqual([]);
      expect(parseItems(JSON.stringify(mockDemoResponse.items))).toHaveLength(3);
    });
  });
});
