/**
 * Device Catalog Unit Tests
 * 
 * TDD: These tests are written BEFORE implementation.
 * Tests cover device search, retrieval, and attribute validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  searchDevices,
  getDeviceById,
  validateDeviceAttributes,
  fuzzyMatch,
  groupAttributesByType,
  setDeviceRepository,
} from '../src/device-catalog';
import type {
  TechDevice,
  DeviceAttribute,
  DeviceSearchParams,
  DeviceSearchResult,
  TechDeviceWithAttributes,
} from '../src/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockDevices: TechDevice[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    brand: 'Apple',
    model: 'iPhone 13',
    category: 'smartphone',
    releaseYear: 2021,
    basePrice: 450.00,
    currency: 'GBP',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    brand: 'Apple',
    model: 'iPhone 14',
    category: 'smartphone',
    releaseYear: 2022,
    basePrice: 550.00,
    currency: 'GBP',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    brand: 'Samsung',
    model: 'Galaxy S22',
    category: 'smartphone',
    releaseYear: 2022,
    basePrice: 400.00,
    currency: 'GBP',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    brand: 'Apple',
    model: 'iPad Pro',
    category: 'tablet',
    releaseYear: 2022,
    basePrice: 800.00,
    currency: 'GBP',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    brand: 'Apple',
    model: 'MacBook Pro',
    category: 'laptop',
    releaseYear: 2023,
    basePrice: 1500.00,
    currency: 'GBP',
    isActive: false, // Inactive device
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockAttributes: DeviceAttribute[] = [
  // iPhone 13 attributes
  { id: '1', deviceId: mockDevices[0].id, attributeType: 'storage', attributeValue: '64GB', priceModifier: -25, createdAt: new Date() },
  { id: '2', deviceId: mockDevices[0].id, attributeType: 'storage', attributeValue: '128GB', priceModifier: 0, createdAt: new Date() },
  { id: '3', deviceId: mockDevices[0].id, attributeType: 'storage', attributeValue: '256GB', priceModifier: 30, createdAt: new Date() },
  { id: '4', deviceId: mockDevices[0].id, attributeType: 'color', attributeValue: 'Midnight', priceModifier: 0, createdAt: new Date() },
  { id: '5', deviceId: mockDevices[0].id, attributeType: 'color', attributeValue: 'Starlight', priceModifier: 0, createdAt: new Date() },
  { id: '6', deviceId: mockDevices[0].id, attributeType: 'carrier', attributeValue: 'Unlocked', priceModifier: 0, createdAt: new Date() },
  { id: '7', deviceId: mockDevices[0].id, attributeType: 'carrier', attributeValue: 'EE', priceModifier: -40, createdAt: new Date() },
  // iPhone 14 attributes
  { id: '8', deviceId: mockDevices[1].id, attributeType: 'storage', attributeValue: '128GB', priceModifier: 0, createdAt: new Date() },
  { id: '9', deviceId: mockDevices[1].id, attributeType: 'storage', attributeValue: '256GB', priceModifier: 50, createdAt: new Date() },
];

// ============================================================================
// Mock Repository Setup
// ============================================================================

function setupMockRepository() {
  const mockRepo = {
    findMany: vi.fn(async (params) => {
      let devices = [...mockDevices];
      
      if (params?.where?.isActive !== undefined) {
        devices = devices.filter(d => d.isActive === params.where.isActive);
      }
      if (params?.where?.brand) {
        devices = devices.filter(d => d.brand === params.where.brand);
      }
      if (params?.where?.category) {
        devices = devices.filter(d => d.category === params.where.category);
      }
      
      // Add attributes
      return devices.map(d => ({
        ...d,
        attributes: mockAttributes.filter(a => a.deviceId === d.id),
      }));
    }),
    findUnique: vi.fn(async (params) => {
      const device = mockDevices.find(d => d.id === params.where.id);
      if (!device) return null;
      return {
        ...device,
        attributes: mockAttributes.filter(a => a.deviceId === device.id),
      };
    }),
    count: vi.fn(async (params) => {
      let devices = [...mockDevices];
      if (params?.where?.isActive !== undefined) {
        devices = devices.filter(d => d.isActive === params.where.isActive);
      }
      return devices.length;
    }),
  };
  
  setDeviceRepository(mockRepo);
  return mockRepo;
}

// ============================================================================
// Fuzzy Search Tests
// ============================================================================

describe('fuzzyMatch', () => {
  it('should match exact string', () => {
    expect(fuzzyMatch('iPhone 13', 'iPhone 13')).toBe(true);
  });

  it('should match case-insensitively', () => {
    expect(fuzzyMatch('iphone 13', 'iPhone 13')).toBe(true);
    expect(fuzzyMatch('IPHONE 13', 'iPhone 13')).toBe(true);
  });

  it('should match partial string', () => {
    expect(fuzzyMatch('iPhone', 'iPhone 13')).toBe(true);
    expect(fuzzyMatch('13', 'iPhone 13')).toBe(true);
  });

  it('should tolerate single character typo', () => {
    expect(fuzzyMatch('iPhne 13', 'iPhone 13')).toBe(true); // Missing 'o'
    expect(fuzzyMatch('iPhome 13', 'iPhone 13')).toBe(true); // 'm' instead of 'n'
  });

  it('should not match completely different strings', () => {
    expect(fuzzyMatch('Samsung Galaxy', 'iPhone 13')).toBe(false);
  });

  it('should handle empty query', () => {
    expect(fuzzyMatch('', 'iPhone 13')).toBe(true); // Empty matches everything
  });

  it('should handle empty target', () => {
    expect(fuzzyMatch('iPhone', '')).toBe(false);
  });
});

// ============================================================================
// Search Devices Tests
// ============================================================================

describe('searchDevices', () => {
  beforeEach(() => {
    setupMockRepository();
  });

  it('should return all active devices when no filters', async () => {
    const result = await searchDevices({});
    
    expect(result.devices.length).toBeGreaterThan(0);
    // Should not include inactive devices
    result.devices.forEach(device => {
      expect(device.isActive).toBe(true);
    });
  });

  it('should return devices matching exact brand', async () => {
    const result = await searchDevices({ brand: 'Apple' });
    
    result.devices.forEach(device => {
      expect(device.brand).toBe('Apple');
    });
  });

  it('should return devices matching fuzzy query', async () => {
    const result = await searchDevices({ query: 'iphone' });
    
    expect(result.devices.length).toBeGreaterThan(0);
    result.devices.forEach(device => {
      expect(device.model.toLowerCase()).toContain('iphone');
    });
  });

  it('should return devices matching query with typo', async () => {
    const result = await searchDevices({ query: 'iphne' }); // Typo
    
    // Should still find iPhones due to fuzzy matching
    expect(result.devices.length).toBeGreaterThan(0);
  });

  it('should filter by category', async () => {
    const result = await searchDevices({ category: 'tablet' });
    
    result.devices.forEach(device => {
      expect(device.category).toBe('tablet');
    });
  });

  it('should combine brand and category filters', async () => {
    const result = await searchDevices({ brand: 'Apple', category: 'smartphone' });
    
    result.devices.forEach(device => {
      expect(device.brand).toBe('Apple');
      expect(device.category).toBe('smartphone');
    });
  });

  it('should paginate results correctly', async () => {
    const page1 = await searchDevices({ page: 1, limit: 2 });
    const page2 = await searchDevices({ page: 2, limit: 2 });
    
    expect(page1.devices.length).toBeLessThanOrEqual(2);
    expect(page1.pagination.page).toBe(1);
    expect(page1.pagination.limit).toBe(2);
    
    // Pages should have different devices (if enough devices exist)
    if (page2.devices.length > 0) {
      expect(page1.devices[0].id).not.toBe(page2.devices[0].id);
    }
  });

  it('should return correct pagination metadata', async () => {
    const result = await searchDevices({ page: 1, limit: 2 });
    
    expect(result.pagination).toHaveProperty('page');
    expect(result.pagination).toHaveProperty('limit');
    expect(result.pagination).toHaveProperty('total');
    expect(result.pagination).toHaveProperty('totalPages');
    expect(result.pagination.totalPages).toBe(Math.ceil(result.pagination.total / result.pagination.limit));
  });

  it('should return empty array for no matches', async () => {
    const result = await searchDevices({ query: 'NonExistentDevice12345' });
    
    expect(result.devices).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });

  it('should handle special characters in query', async () => {
    // Should not throw, should return empty or filtered results
    const result = await searchDevices({ query: 'iPhone (13)' });
    expect(result).toBeDefined();
  });

  it('should use default pagination when not specified', async () => {
    const result = await searchDevices({});
    
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
  });

  it('should cap limit at maximum (100)', async () => {
    const result = await searchDevices({ limit: 500 });
    
    expect(result.pagination.limit).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// Get Device By ID Tests
// ============================================================================

describe('getDeviceById', () => {
  beforeEach(() => {
    setupMockRepository();
  });

  it('should return device with all attributes', async () => {
    const device = await getDeviceById(mockDevices[0].id);
    
    expect(device).not.toBeNull();
    expect(device!.id).toBe(mockDevices[0].id);
    expect(device!.brand).toBe('Apple');
    expect(device!.model).toBe('iPhone 13');
    expect(device!.attributes).toBeDefined();
    expect(Array.isArray(device!.attributes)).toBe(true);
  });

  it('should return null for non-existent device', async () => {
    // Use a valid UUID format that doesn't exist in the database
    const device = await getDeviceById('00000000-0000-0000-0000-000000000000');
    
    expect(device).toBeNull();
  });

  it('should throw for invalid UUID format', async () => {
    await expect(getDeviceById('not-a-uuid')).rejects.toThrow();
  });

  it('should return null for inactive device', async () => {
    // Inactive devices should not be returned
    const device = await getDeviceById(mockDevices[4].id);
    
    expect(device).toBeNull();
  });

  it('should group attributes by type', async () => {
    const device = await getDeviceById(mockDevices[0].id);
    
    expect(device).not.toBeNull();
    
    // Attributes should be grouped
    const storageAttr = device!.attributes.find(a => a.type === 'storage');
    expect(storageAttr).toBeDefined();
    expect(storageAttr!.values).toContain('64GB');
    expect(storageAttr!.values).toContain('128GB');
    expect(storageAttr!.values).toContain('256GB');
  });

  it('should include price modifiers in attribute groups', async () => {
    const device = await getDeviceById(mockDevices[0].id);
    
    const storageAttr = device!.attributes.find(a => a.type === 'storage');
    expect(storageAttr!.modifiers).toBeDefined();
    
    const modifier256 = storageAttr!.modifiers.find(m => m.value === '256GB');
    expect(modifier256!.priceModifier).toBe(30);
  });
});

// ============================================================================
// Validate Device Attributes Tests
// ============================================================================

describe('validateDeviceAttributes', () => {
  beforeEach(() => {
    setupMockRepository();
  });

  it('should return true for valid attribute combination', async () => {
    const valid = await validateDeviceAttributes(mockDevices[0].id, {
      storage: '128GB',
      color: 'Midnight',
      carrier: 'Unlocked',
    });
    
    expect(valid).toBe(true);
  });

  it('should return false for invalid attribute type', async () => {
    const valid = await validateDeviceAttributes(mockDevices[0].id, {
      invalidType: 'someValue',
    });
    
    expect(valid).toBe(false);
  });

  it('should return false for invalid attribute value', async () => {
    const valid = await validateDeviceAttributes(mockDevices[0].id, {
      storage: '512GB', // Not available for iPhone 13
    });
    
    expect(valid).toBe(false);
  });

  it('should return true for empty attributes', async () => {
    // Empty is valid - no attributes selected
    const valid = await validateDeviceAttributes(mockDevices[0].id, {});
    
    expect(valid).toBe(true);
  });

  it('should return false for non-existent device', async () => {
    const valid = await validateDeviceAttributes('non-existent-uuid', {
      storage: '128GB',
    });
    
    expect(valid).toBe(false);
  });

  it('should validate partial attribute selection', async () => {
    // Only selecting storage, not color or carrier
    const valid = await validateDeviceAttributes(mockDevices[0].id, {
      storage: '256GB',
    });
    
    expect(valid).toBe(true);
  });

  it('should be case-sensitive for attribute values', async () => {
    // 'midnight' vs 'Midnight'
    const valid = await validateDeviceAttributes(mockDevices[0].id, {
      color: 'midnight', // Wrong case
    });
    
    // Depending on implementation, this could be true or false
    // For strictness, we expect false
    expect(valid).toBe(false);
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('groupAttributesByType', () => {
  it('should group attributes correctly', () => {
    const attributes = mockAttributes.filter(a => a.deviceId === mockDevices[0].id);
    const grouped = groupAttributesByType(attributes);
    
    expect(grouped).toHaveLength(3); // storage, color, carrier
    
    const storage = grouped.find(g => g.type === 'storage');
    expect(storage!.values).toHaveLength(3);
    expect(storage!.modifiers).toHaveLength(3);
  });

  it('should return empty array for no attributes', () => {
    const grouped = groupAttributesByType([]);
    expect(grouped).toHaveLength(0);
  });

  it('should sort values alphabetically', () => {
    const attributes = mockAttributes.filter(a => a.deviceId === mockDevices[0].id);
    const grouped = groupAttributesByType(attributes);
    
    const storage = grouped.find(g => g.type === 'storage');
    // Should be sorted: 128GB, 256GB, 64GB (alphabetically)
    expect(storage!.values[0]).toBe('128GB');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    setupMockRepository();
  });

  it('should handle device with no attributes', async () => {
    // Galaxy S22 has no attributes in our fixtures
    const device = await getDeviceById(mockDevices[2].id);
    
    expect(device).not.toBeNull();
    expect(device!.attributes).toHaveLength(0);
  });

  it('should handle very long search queries', async () => {
    const longQuery = 'a'.repeat(1000);
    const result = await searchDevices({ query: longQuery });
    
    // Should not throw, should return empty results
    expect(result.devices).toHaveLength(0);
  });

  it('should handle page number beyond total pages', async () => {
    const result = await searchDevices({ page: 9999, limit: 10 });
    
    expect(result.devices).toHaveLength(0);
    expect(result.pagination.page).toBe(9999);
  });

  it('should handle zero or negative page numbers', async () => {
    // Should default to page 1
    const result = await searchDevices({ page: 0 });
    expect(result.pagination.page).toBe(1);

    const result2 = await searchDevices({ page: -5 });
    expect(result2.pagination.page).toBe(1);
  });

  it('should handle zero or negative limit', async () => {
    // Should use default limit
    const result = await searchDevices({ limit: 0 });
    expect(result.pagination.limit).toBe(20);

    const result2 = await searchDevices({ limit: -10 });
    expect(result2.pagination.limit).toBe(20);
  });
});

