/**
 * Unit tests for AppContext
 * 
 * Tests state transitions for:
 * - Demo mode toggle
 * - Entitlement resolution (enabled / grace / blocked)
 * - Usage state updates
 * - Last query/marketplace/country tracking
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AppProvider, useApp } from '../../context/AppContext';

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext', () => {
  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.state).toEqual({
        demoMode: true, // Default to demo mode
        lastQuery: null,
        lastMarketplace: null,
        lastCountry: null,
        entitlement: null,
        usage: null,
      });
    });
  });

  describe('Demo Mode', () => {
    it('should toggle demo mode on', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setDemoMode(true);
      });

      expect(result.current.state.demoMode).toBe(true);
    });

    it('should toggle demo mode off', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setDemoMode(false);
      });

      expect(result.current.state.demoMode).toBe(false);
    });

    it('should preserve other state when toggling demo mode', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setLastQuery('macbook');
        result.current.setDemoMode(false);
      });

      expect(result.current.state.lastQuery).toBe('macbook');
      expect(result.current.state.demoMode).toBe(false);
    });
  });

  describe('Last Query Tracking', () => {
    it('should set last query', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setLastQuery('iphone 13');
      });

      expect(result.current.state.lastQuery).toBe('iphone 13');
    });

    it('should clear last query with null', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setLastQuery('test');
        result.current.setLastQuery(null);
      });

      expect(result.current.state.lastQuery).toBeNull();
    });
  });

  describe('Marketplace Selection', () => {
    it('should set last marketplace', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setLastMarketplace('vinted');
      });

      expect(result.current.state.lastMarketplace).toBe('vinted');
    });

    it('should accept all valid marketplace types', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const marketplaces = ['facebook', 'vinted', 'gumtree'] as const;

      marketplaces.forEach((mp) => {
        act(() => {
          result.current.setLastMarketplace(mp);
        });
        expect(result.current.state.lastMarketplace).toBe(mp);
      });
    });
  });

  describe('Country Selection', () => {
    it('should set last country', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setLastCountry('GB');
      });

      expect(result.current.state.lastCountry).toBe('GB');
    });

    it('should accept various country codes', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const countries = ['GB', 'US', 'FR', 'DE'];

      countries.forEach((country) => {
        act(() => {
          result.current.setLastCountry(country);
        });
        expect(result.current.state.lastCountry).toBe(country);
      });
    });
  });

  describe('Entitlement State', () => {
    it('should set entitlement with active status', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const entitlement = {
        enabled: true,
        status: 'active' as const,
        graceUntil: null,
      };

      act(() => {
        result.current.setEntitlement(entitlement);
      });

      expect(result.current.state.entitlement).toEqual(entitlement);
      expect(result.current.state.entitlement?.enabled).toBe(true);
      expect(result.current.state.entitlement?.status).toBe('active');
    });

    it('should set entitlement with trialing status', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const entitlement = {
        enabled: true,
        status: 'trialing' as const,
        graceUntil: null,
      };

      act(() => {
        result.current.setEntitlement(entitlement);
      });

      expect(result.current.state.entitlement?.status).toBe('trialing');
    });

    it('should set entitlement with past_due status and grace period', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const graceDate = '2024-02-01T00:00:00Z';
      const entitlement = {
        enabled: true,
        status: 'past_due' as const,
        graceUntil: graceDate,
      };

      act(() => {
        result.current.setEntitlement(entitlement);
      });

      expect(result.current.state.entitlement?.status).toBe('past_due');
      expect(result.current.state.entitlement?.graceUntil).toBe(graceDate);
    });

    it('should set entitlement with canceled status (blocked)', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const entitlement = {
        enabled: false,
        status: 'canceled' as const,
        graceUntil: null,
      };

      act(() => {
        result.current.setEntitlement(entitlement);
      });

      expect(result.current.state.entitlement?.enabled).toBe(false);
      expect(result.current.state.entitlement?.status).toBe('canceled');
    });

    it('should set entitlement with comped status', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const entitlement = {
        enabled: true,
        status: 'comped' as const,
        graceUntil: null,
      };

      act(() => {
        result.current.setEntitlement(entitlement);
      });

      expect(result.current.state.entitlement?.status).toBe('comped');
      expect(result.current.state.entitlement?.enabled).toBe(true);
    });

    it('should clear entitlement with null', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setEntitlement({
          enabled: true,
          status: 'active',
          graceUntil: null,
        });
        result.current.setEntitlement(null);
      });

      expect(result.current.state.entitlement).toBeNull();
    });
  });

  describe('Usage State', () => {
    it('should set usage data', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const usage = {
        runs: 50,
        itemsReturned: 1000,
        runsPerDay: 250,
        itemsPerDay: 20000,
      };

      act(() => {
        result.current.setUsage(usage);
      });

      expect(result.current.state.usage).toEqual(usage);
    });

    it('should update usage incrementally', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setUsage({
          runs: 10,
          itemsReturned: 200,
          runsPerDay: 250,
          itemsPerDay: 20000,
        });
      });

      act(() => {
        result.current.setUsage({
          runs: 20,
          itemsReturned: 400,
          runsPerDay: 250,
          itemsPerDay: 20000,
        });
      });

      expect(result.current.state.usage?.runs).toBe(20);
      expect(result.current.state.usage?.itemsReturned).toBe(400);
    });

    it('should handle usage at limits', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setUsage({
          runs: 250,
          itemsReturned: 20000,
          runsPerDay: 250,
          itemsPerDay: 20000,
        });
      });

      expect(result.current.state.usage?.runs).toBe(250);
      expect(result.current.state.usage?.itemsReturned).toBe(20000);
    });

    it('should clear usage with null', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setUsage({
          runs: 10,
          itemsReturned: 200,
          runsPerDay: 250,
          itemsPerDay: 20000,
        });
        result.current.setUsage(null);
      });

      expect(result.current.state.usage).toBeNull();
    });
  });

  describe('Combined State Updates', () => {
    it('should handle multiple state updates in sequence', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setDemoMode(false);
        result.current.setLastQuery('macbook pro');
        result.current.setLastMarketplace('gumtree');
        result.current.setLastCountry('GB');
        result.current.setEntitlement({
          enabled: true,
          status: 'active',
          graceUntil: null,
        });
        result.current.setUsage({
          runs: 5,
          itemsReturned: 100,
          runsPerDay: 250,
          itemsPerDay: 20000,
        });
      });

      expect(result.current.state).toEqual({
        demoMode: false,
        lastQuery: 'macbook pro',
        lastMarketplace: 'gumtree',
        lastCountry: 'GB',
        entitlement: {
          enabled: true,
          status: 'active',
          graceUntil: null,
        },
        usage: {
          runs: 5,
          itemsReturned: 100,
          runsPerDay: 250,
          itemsPerDay: 20000,
        },
      });
    });

    it('should preserve unrelated state when updating one field', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Set initial state
      act(() => {
        result.current.setLastQuery('test query');
        result.current.setLastMarketplace('vinted');
        result.current.setLastCountry('FR');
      });

      // Update only one field
      act(() => {
        result.current.setLastQuery('new query');
      });

      // Other fields should be preserved
      expect(result.current.state.lastMarketplace).toBe('vinted');
      expect(result.current.state.lastCountry).toBe('FR');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useApp is used outside AppProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useApp());
      }).toThrow('useApp must be used within AppProvider');

      consoleSpy.mockRestore();
    });
  });
});

