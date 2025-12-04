#!/usr/bin/env node

/**
 * Vercel Environment Variables Sync Script
 * Uses Vercel API to sync environment variables
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_ORG_ID;

if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
  console.error('❌ Missing VERCEL_TOKEN or VERCEL_PROJECT_ID in .env.production');
  process.exit(1);
}

// Environment variables to sync
const ENV_VARS = [
  // Supabase
  { key: 'NEXT_PUBLIC_SUPABASE_URL', type: 'plain', target: ['production', 'preview'] },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', type: 'plain', target: ['production', 'preview'] },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', type: 'secret', target: ['production'] },
  
  // Stripe
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', type: 'plain', target: ['production', 'preview'] },
  { key: 'STRIPE_SECRET_KEY', type: 'secret', target: ['production'] },
  { key: 'STRIPE_WEBHOOK_SECRET', type: 'secret', target: ['production'] },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_ID_PRO', type: 'plain', target: ['production', 'preview'] },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY', type: 'plain', target: ['production', 'preview'] },
  
  // AI/ML
  { key: 'DEEPSEEK_API_KEY', type: 'secret', target: ['production'] },
  { key: 'OPENAI_API_KEY', type: 'secret', target: ['production'] },
  
  // Shipping
  { key: 'USPS_API_KEY', type: 'secret', target: ['production'] },
  
  // Azure
  { key: 'AZURE_FUNCTION_URL', type: 'plain', target: ['production'] },
  { key: 'AZURE_FUNCTION_KEY', type: 'secret', target: ['production'] },
  
  // App Config
  { key: 'NEXT_PUBLIC_APP_ENV', value: 'production', type: 'plain', target: ['production'] },
  { key: 'NEXT_PUBLIC_APP_URL', value: 'https://flipperagents.com', type: 'plain', target: ['production'] },
  { key: 'NEXT_PUBLIC_APP_VERSION', type: 'plain', target: ['production'] },
  
  // Security
  { key: 'NEXTAUTH_SECRET', type: 'secret', target: ['production'] },
  { key: 'JWT_SECRET', type: 'secret', target: ['production'] },
  
  // Monitoring
  { key: 'SENTRY_DSN', type: 'plain', target: ['production', 'preview'] },
  { key: 'SENTRY_AUTH_TOKEN', type: 'secret', target: ['production'] },
];

/**
 * Make HTTPS request to Vercel API
 */
function vercelRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'));
        } else {
          reject(new Error(`Vercel API error: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Get existing environment variables
 */
async function getExistingEnvVars() {
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
  const path = `/v9/projects/${VERCEL_PROJECT_ID}/env${teamParam}`;
  
  try {
    const response = await vercelRequest(path);
    return response.envs || [];
  } catch (error) {
    console.error('Error fetching existing env vars:', error.message);
    return [];
  }
}

/**
 * Create or update environment variable
 */
async function upsertEnvVar(key, value, type, target) {
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
  const path = `/v10/projects/${VERCEL_PROJECT_ID}/env${teamParam}`;
  
  const payload = {
    key: key,
    value: value,
    type: type === 'secret' ? 'secret' : 'plain',
    target: target,
  };

  try {
    await vercelRequest(path, 'POST', payload);
    console.log(`✓ Set ${key} for ${target.join(', ')}`);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠ ${key} already exists, skipping...`);
    } else {
      console.error(`✗ Failed to set ${key}:`, error.message);
    }
  }
}

/**
 * Main sync function
 */
async function syncEnvironmentVariables() {
  console.log('🔄 Syncing environment variables to Vercel...\n');

  // Get existing vars
  console.log('Fetching existing environment variables...');
  const existingVars = await getExistingEnvVars();
  console.log(`Found ${existingVars.length} existing variables\n`);

  // Sync each variable
  for (const envVar of ENV_VARS) {
    const value = envVar.value || process.env[envVar.key];
    
    if (!value) {
      console.log(`⚠ Skipping ${envVar.key} (not set in .env.production)`);
      continue;
    }

    await upsertEnvVar(envVar.key, value, envVar.type, envVar.target);
  }

  console.log('\n✅ Environment sync complete!');
}

// Run
syncEnvironmentVariables().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
