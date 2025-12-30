import { describe, it, expect } from 'vitest';
import { normalizeQuery, searchKey, ingestKey, lockKey, ttlFor } from '../../lib/redis';

describe('normalizeQuery', () => {
  it('should convert to lowercase', () => {
    expect(normalizeQuery('MacBook Pro')).toBe('macbook_pro');
  });

  it('should replace special characters with underscores', () => {
    expect(normalizeQuery('iPhone 13 Pro-Max')).toBe('iphone_13_pro_max');
  });

  it('should remove leading and trailing underscores', () => {
    expect(normalizeQuery('  MacBook Pro  ')).toBe('macbook_pro');
  });

  it('should handle empty string', () => {
    expect(normalizeQuery('')).toBe('');
  });

  it('should truncate to 80 characters', () => {
    const longQuery = 'a'.repeat(100);
    const normalized = normalizeQuery(longQuery);
    expect(normalized.length).toBeLessThanOrEqual(80);
  });

  it('should handle multiple spaces and special chars', () => {
    expect(normalizeQuery('MacBook   Pro!!!')).toBe('macbook_pro');
  });
});

describe('searchKey', () => {
  it('should generate correct search key format', () => {
    const key = searchKey('gumtree', 'GB', 'macbook_pro');
    expect(key).toBe('search:gumtree:GB:macbook_pro');
  });

  it('should handle different marketplaces', () => {
    expect(searchKey('vinted', 'FR', 'iphone_13')).toBe('search:vinted:FR:iphone_13');
    expect(searchKey('facebook', 'US', 'samsung_galaxy')).toBe('search:facebook:US:samsung_galaxy');
  });
});

describe('ingestKey', () => {
  it('should generate correct ingest key format', () => {
    const key = ingestKey('vinted', 'GB', 'macbook_pro');
    expect(key).toBe('browser_ingest:vinted:GB:macbook_pro');
  });

  it('should handle different marketplaces', () => {
    expect(ingestKey('facebook', 'US', 'iphone_13')).toBe('browser_ingest:facebook:US:iphone_13');
  });
});

describe('lockKey', () => {
  it('should generate correct lock key format', () => {
    const key = lockKey('gumtree', 'GB', 'macbook_pro');
    expect(key).toBe('lock:search:gumtree:GB:macbook_pro');
  });

  it('should handle different marketplaces', () => {
    expect(lockKey('vinted', 'FR', 'iphone_13')).toBe('lock:search:vinted:FR:iphone_13');
  });
});

describe('ttlFor', () => {
  it('should return 120 seconds for gumtree', () => {
    expect(ttlFor('gumtree')).toBe(120);
  });

  it('should return 300 seconds for vinted', () => {
    expect(ttlFor('vinted')).toBe(300);
  });

  it('should return 300 seconds for facebook', () => {
    expect(ttlFor('facebook')).toBe(300);
  });

  it('should return 300 seconds as default for unknown marketplace', () => {
    expect(ttlFor('unknown' as any)).toBe(300);
  });
});

