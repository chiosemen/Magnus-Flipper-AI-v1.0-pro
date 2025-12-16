/**
 * Device Catalog Module
 * 
 * Manages the searchable registry of tech devices with fuzzy search,
 * filtering, pagination, and attribute validation.
 */

import type {
  TechDevice,
  DeviceAttribute,
  DeviceSearchParams,
  DeviceSearchResult,
  TechDeviceWithAttributes,
  DeviceAttributeGroup,
} from './types';

// Note: In production, this would use @magnus-flipper-ai/core/db
// For now, we define the interface and mock implementation

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching with typo tolerance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if a query fuzzy matches a target string
 * 
 * Supports:
 * - Case-insensitive matching
 * - Partial string matching
 * - Single character typo tolerance
 * 
 * @param query - The search query
 * @param target - The target string to match against
 * @returns True if query matches target
 */
export function fuzzyMatch(query: string, target: string): boolean {
  // Empty query matches everything
  if (!query || query.trim() === '') {
    return true;
  }

  // Empty target matches nothing
  if (!target || target.trim() === '') {
    return false;
  }

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedTarget = target.toLowerCase().trim();

  // Exact match
  if (normalizedTarget === normalizedQuery) {
    return true;
  }

  // Partial match (query contained in target)
  if (normalizedTarget.includes(normalizedQuery)) {
    return true;
  }

  // Check each word in target for partial match
  const targetWords = normalizedTarget.split(/\s+/);
  for (const word of targetWords) {
    if (word.includes(normalizedQuery)) {
      return true;
    }
  }

  // Typo tolerance: allow 1 character difference for queries > 3 chars
  if (normalizedQuery.length > 3) {
    // Check if query is close to any word in target
    for (const word of targetWords) {
      const distance = levenshteinDistance(normalizedQuery, word);
      if (distance <= 1) {
        return true;
      }
    }

    // Check if query is close to full target
    if (levenshteinDistance(normalizedQuery, normalizedTarget) <= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Group flat device attributes into typed groups
 * 
 * @param attributes - Flat list of device attributes
 * @returns Grouped attributes by type
 */
export function groupAttributesByType(
  attributes: DeviceAttribute[]
): DeviceAttributeGroup[] {
  const groups: Map<string, DeviceAttributeGroup> = new Map();

  for (const attr of attributes) {
    if (!groups.has(attr.attributeType)) {
      groups.set(attr.attributeType, {
        type: attr.attributeType,
        values: [],
        modifiers: [],
      });
    }

    const group = groups.get(attr.attributeType)!;
    group.values.push(attr.attributeValue);
    group.modifiers.push({
      value: attr.attributeValue,
      priceModifier: attr.priceModifier,
    });
  }

  // Sort values alphabetically within each group
  const result: DeviceAttributeGroup[] = [];
  for (const group of groups.values()) {
    group.values.sort();
    result.push(group);
  }

  return result;
}

/**
 * Validate UUID format
 */
function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// ============================================================================
// Database Interface (to be implemented with Prisma)
// ============================================================================

// These functions will be implemented with actual Prisma queries
// For now, they define the interface contract

interface DeviceRepository {
  findMany(params: {
    where?: {
      isActive?: boolean;
      brand?: string;
      category?: string;
    };
    skip?: number;
    take?: number;
    include?: {
      attributes?: boolean;
    };
  }): Promise<(TechDevice & { attributes?: DeviceAttribute[] })[]>;

  findUnique(params: {
    where: { id: string };
    include?: { attributes?: boolean };
  }): Promise<(TechDevice & { attributes?: DeviceAttribute[] }) | null>;

  count(params: { where?: { isActive?: boolean; brand?: string; category?: string } }): Promise<number>;
}

// This will be replaced with actual Prisma client
let deviceRepository: DeviceRepository | null = null;

/**
 * Set the device repository (dependency injection for testing)
 */
export function setDeviceRepository(repo: DeviceRepository): void {
  deviceRepository = repo;
}

/**
 * Get the device repository, throwing if not set
 */
function getRepository(): DeviceRepository {
  if (!deviceRepository) {
    throw new Error('Device repository not initialized. Call setDeviceRepository first.');
  }
  return deviceRepository;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Search devices with filters and pagination
 * 
 * @param params - Search parameters
 * @returns Paginated device results
 */
export async function searchDevices(
  params: DeviceSearchParams
): Promise<DeviceSearchResult> {
  const repo = getRepository();

  // Normalize pagination params
  let page = params.page ?? 1;
  let limit = params.limit ?? 20;

  // Enforce bounds
  if (page < 1) page = 1;
  if (limit < 1) limit = 20;
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: { isActive: boolean; brand?: string; category?: string } = {
    isActive: true,
  };

  if (params.brand) {
    where.brand = params.brand;
  }

  if (params.category) {
    where.category = params.category;
  }

  // Fetch devices
  let devices = await repo.findMany({
    where,
    include: { attributes: true },
  });

  // Apply fuzzy search filter if query provided
  if (params.query && params.query.trim() !== '') {
    devices = devices.filter(device => {
      const searchText = `${device.brand} ${device.model}`;
      return fuzzyMatch(params.query!, searchText);
    });
  }

  // Get total count after filtering
  const total = devices.length;
  const totalPages = Math.ceil(total / limit);

  // Apply pagination
  const paginatedDevices = devices.slice(skip, skip + limit);

  // Transform to TechDeviceWithAttributes
  const result: TechDeviceWithAttributes[] = paginatedDevices.map(device => ({
    ...device,
    attributes: groupAttributesByType(device.attributes || []),
  }));

  return {
    devices: result,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Get a single device by ID with all attributes
 * 
 * @param deviceId - The device UUID
 * @returns Device with attributes or null if not found
 * @throws Error if deviceId is not a valid UUID
 */
export async function getDeviceById(
  deviceId: string
): Promise<TechDeviceWithAttributes | null> {
  // Validate UUID format
  if (!isValidUuid(deviceId)) {
    throw new Error(`Invalid UUID format: ${deviceId}`);
  }

  const repo = getRepository();

  const device = await repo.findUnique({
    where: { id: deviceId },
    include: { attributes: true },
  });

  // Return null for non-existent or inactive devices
  if (!device || !device.isActive) {
    return null;
  }

  return {
    ...device,
    attributes: groupAttributesByType(device.attributes || []),
  };
}

/**
 * Validate that selected attributes are valid for a device
 * 
 * @param deviceId - The device UUID
 * @param attributes - Selected attributes to validate
 * @returns True if all attributes are valid
 */
export async function validateDeviceAttributes(
  deviceId: string,
  attributes: Record<string, string>
): Promise<boolean> {
  // Empty attributes is always valid
  if (Object.keys(attributes).length === 0) {
    return true;
  }

  // Get device with attributes
  let device: TechDeviceWithAttributes | null;
  try {
    device = await getDeviceById(deviceId);
  } catch {
    return false;
  }

  if (!device) {
    return false;
  }

  // Check each provided attribute
  for (const [type, value] of Object.entries(attributes)) {
    const attrGroup = device.attributes.find(a => a.type === type);
    
    // Unknown attribute type
    if (!attrGroup) {
      return false;
    }

    // Unknown attribute value (case-sensitive)
    if (!attrGroup.values.includes(value)) {
      return false;
    }
  }

  return true;
}

