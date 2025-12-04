/**
 * Input Sanitization Utilities
 * Sanitizes user input to prevent XSS, injection attacks, and malformed data
 */

/**
 * Sanitize a string input
 * Removes potentially dangerous characters and normalizes whitespace
 */
export function sanitizeString(input: unknown, maxLength: number = 10000): string {
  if (typeof input !== 'string') {
    return String(input).slice(0, maxLength);
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().slice(0, maxLength);
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Sanitize a number input
 */
export function sanitizeNumber(input: unknown): number | null {
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? null : input;
  }
  
  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    return isNaN(parsed) || !isFinite(parsed) ? null : parsed;
  }
  
  return null;
}

/**
 * Sanitize a boolean input
 */
export function sanitizeBoolean(input: unknown): boolean {
  if (typeof input === 'boolean') {
    return input;
  }
  
  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  
  if (typeof input === 'number') {
    return input === 1;
  }
  
  return false;
}

/**
 * Sanitize an object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: { maxDepth?: number; maxKeys?: number; maxStringLength?: number } = {}
): Partial<T> {
  const { maxDepth = 10, maxKeys = 100, maxStringLength = 10000 } = options;
  
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj as Partial<T>;
  }

  const sanitized: Record<string, any> = {};
  const keys = Object.keys(obj);
  
  // Limit number of keys
  const limitedKeys = keys.slice(0, maxKeys);
  
  for (const key of limitedKeys) {
    // Sanitize key name
    const sanitizedKey = sanitizeString(key, 100);
    
    if (!sanitizedKey) continue;
    
    const value = obj[key];
    
    if (value === null || value === undefined) {
      sanitized[sanitizedKey] = value;
      continue;
    }
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value, maxStringLength);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = sanitizeNumber(value);
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = sanitizeBoolean(value);
    } else if (Array.isArray(value)) {
      // Limit array size
      sanitized[sanitizedKey] = value.slice(0, 100).map((item) => {
        if (typeof item === 'string') return sanitizeString(item, maxStringLength);
        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item, { maxDepth: maxDepth - 1, maxKeys, maxStringLength });
        }
        return item;
      });
    } else if (typeof value === 'object') {
      if (maxDepth > 0) {
        sanitized[sanitizedKey] = sanitizeObject(value, { maxDepth: maxDepth - 1, maxKeys, maxStringLength });
      }
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized as Partial<T>;
}

/**
 * Sanitize URL search parameters
 */
export function sanitizeSearchParams(
  params: URLSearchParams | Record<string, string | string[]>
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  let entries: [string, string | string[]][];
  
  if (params instanceof URLSearchParams) {
    entries = Array.from(params.entries()).map(([k, v]) => [k, v]);
  } else {
    entries = Object.entries(params);
  }
  
  for (const [key, value] of entries) {
    const sanitizedKey = sanitizeString(key, 100);
    if (!sanitizedKey) continue;
    
    if (Array.isArray(value)) {
      // Take first value only
      sanitized[sanitizedKey] = sanitizeString(value[0], 1000);
    } else {
      sanitized[sanitizedKey] = sanitizeString(value, 1000);
    }
  }
  
  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') {
    return null;
  }
  
  const sanitized = sanitizeString(email, 254).toLowerCase().trim();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: unknown): string | null {
  if (typeof url !== 'string') {
    return null;
  }
  
  const sanitized = sanitizeString(url, 2048).trim();
  
  try {
    const parsed = new URL(sanitized);
    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

