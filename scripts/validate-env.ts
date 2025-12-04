#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * Validates that all required environment variables are set
 * This script should be run during build and deployment
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const optionalEnvVars = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PRO_PRICE',
  'STRIPE_AGENCY_PRICE',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_API_URL',
  'SENTRY_DSN',
  'POSTHOG_KEY',
];

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    } else if (value.includes('your-') || value.includes('placeholder') || value.includes('xxx')) {
      warnings.push(`${varName} appears to be a placeholder value`);
    }
  }
  
  // Check optional variables (warn if missing in production)
  if (process.env.NODE_ENV === 'production') {
    for (const varName of optionalEnvVars) {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        warnings.push(`${varName} is recommended but not set (production)`);
      }
    }
  }
  
  // Validate format of specific variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL should use HTTPS');
  }
  
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (stripeSecret) {
    if (!stripeSecret.startsWith('sk_')) {
      warnings.push('STRIPE_SECRET_KEY format appears invalid (should start with sk_)');
    }
    if (process.env.NODE_ENV === 'production' && stripeSecret.startsWith('sk_test_')) {
      warnings.push('STRIPE_SECRET_KEY appears to be a test key in production');
    }
  }
  
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;
  if (stripeWebhook && !stripeWebhook.startsWith('whsec_')) {
    warnings.push('STRIPE_WEBHOOK_SECRET format appears invalid (should start with whsec_)');
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

function main() {
  console.log('🔍 Validating environment variables...\n');
  
  const result = validateEnvironment();
  
  if (result.missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    result.missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these variables before building.');
    process.exit(1);
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }
  
  if (result.valid) {
    console.log('✅ All required environment variables are set.\n');
    
    if (result.warnings.length === 0) {
      process.exit(0);
    } else {
      // Warnings don't fail the build, but exit with code 0
      process.exit(0);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { validateEnvironment, requiredEnvVars, optionalEnvVars };

