#!/usr/bin/env node

/**
 * Runtime Verification Script
 * Verifies Next.js runtime configuration and environment setup
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

// Check Next.js config
const nextConfigPath = path.join(__dirname, '../next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  console.log('✅ next.config.mjs exists');
} else {
  warnings.push('⚠️  next.config.mjs not found (may use default config)');
}

// Check environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
];

console.log('\n📋 Checking environment variables...');
requiredEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`✅ ${varName} is set`);
  } else {
    errors.push(`❌ ${varName} is missing`);
  }
});

// Check API routes
const apiRoutesPath = path.join(__dirname, '../app/api');
if (fs.existsSync(apiRoutesPath)) {
  console.log('✅ API routes directory exists');
  
  const criticalRoutes = [
    'health/route.ts',
    'stripe/webhook/route.ts',
    'subscription/route.ts',
  ];
  
  criticalRoutes.forEach((route) => {
    const routePath = path.join(apiRoutesPath, route);
    if (fs.existsSync(routePath)) {
      console.log(`✅ ${route} exists`);
    } else {
      warnings.push(`⚠️  ${route} not found`);
    }
  });
} else {
  errors.push('❌ API routes directory not found');
}

// Check middleware
const middlewarePath = path.join(__dirname, '../src/middleware.ts');
if (fs.existsSync(middlewarePath)) {
  console.log('✅ Middleware exists');
} else {
  warnings.push('⚠️  Middleware not found (auth may not be protected)');
}

// Summary
console.log('\n📊 Summary:');
if (errors.length > 0) {
  console.error('\n❌ Errors:');
  errors.forEach((error) => console.error(`  ${error}`));
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('\n⚠️  Warnings:');
  warnings.forEach((warning) => console.warn(`  ${warning}`));
}

console.log('\n✅ Runtime verification complete!');
process.exit(0);

