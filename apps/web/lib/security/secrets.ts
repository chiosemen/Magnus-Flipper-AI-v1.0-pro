/**
 * Secret Handling Utilities
 * Ensures secrets are never exposed in logs or responses
 */

import { logError, logWarn } from '@/lib/observability/logger';

// Patterns that indicate secrets (for detection)
const SECRET_PATTERNS = [
  /sk_live_/i,
  /sk_test_/i,
  /whsec_/i,
  /eyJ[A-Za-z0-9_-]{5,}\.eyJ/i, // JWT tokens
  /sbp_[A-Za-z0-9_-]+/i, // Supabase tokens
  /^[A-Za-z0-9_-]{32,}$/, // Long random strings
];

/**
 * Check if a string looks like a secret
 */
export function looksLikeSecret(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Redact secrets from a string
 */
export function redactSecret(value: string): string {
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  if (!looksLikeSecret(value)) {
    return value;
  }
  
  // Redact: show first 4 and last 4 characters
  if (value.length <= 8) {
    return '***REDACTED***';
  }
  
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

/**
 * Redact secrets from an object recursively
 */
export function redactSecretsFromObject(obj: any, maxDepth: number = 10): any {
  if (maxDepth <= 0) {
    return '[MAX_DEPTH_REACHED]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return redactSecret(obj);
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => redactSecretsFromObject(item, maxDepth - 1));
  }
  
  const redacted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip known secret keys entirely
    if (
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('key') ||
      key.toLowerCase().includes('api_key')
    ) {
      redacted[key] = '***REDACTED***';
      continue;
    }
    
    redacted[key] = redactSecretsFromObject(value, maxDepth - 1);
  }
  
  return redacted;
}

/**
 * Safe logger that redacts secrets
 */
export function safeLog(level: 'info' | 'warn' | 'error', message: string, context?: any): void {
  const redactedContext = context ? redactSecretsFromObject(context) : undefined;
  
  if (level === 'error') {
    logError(message, redactedContext);
  } else if (level === 'warn') {
    logWarn(message, redactedContext);
  } else {
    // Use logInfo from logger
    const { logInfo } = require('@/lib/observability/logger');
    logInfo(message, redactedContext);
  }
}

/**
 * Validate that environment variables don't contain placeholder values
 */
export function validateEnvSecrets(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const requiredSecrets = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];
  
  for (const secretName of requiredSecrets) {
    const value = process.env[secretName];
    
    if (!value) {
      issues.push(`${secretName} is not set`);
      continue;
    }
    
    if (value.includes('your-') || value.includes('placeholder') || value.includes('xxx')) {
      issues.push(`${secretName} appears to be a placeholder`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

