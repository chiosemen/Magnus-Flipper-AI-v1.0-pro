import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Load envs for Node-only scripts.
 * Priority:
 *   1. process.env (CI / Vercel)
 *   2. .env.local (local dev)
 *   3. .env (fallback)
 */
const cwd = process.cwd();
const envFiles = ['.env.local', '.env'];

for (const file of envFiles) {
  const fullPath = path.join(cwd, file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
  }
}

const args = new Set(process.argv.slice(2));
const requireServiceRole = args.has('--require-service-role');

function fail(message) {
  console.error(`[supabase-env] ${message}`);
  process.exit(1);
}

const errors = [];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseUrl.trim()) {
  errors.push('NEXT_PUBLIC_SUPABASE_URL is missing.');
} else if (process.env.NODE_ENV === 'production') {
  const lowered = supabaseUrl.toLowerCase();
  if (lowered.includes('localhost') || lowered.includes('127.0.0.1')) {
    fail('NEXT_PUBLIC_SUPABASE_URL points to localhost in production.');
  }
}

if (!supabaseAnonKey || !supabaseAnonKey.trim()) {
  errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
}

if (requireServiceRole && (!serviceRoleKey || !serviceRoleKey.trim())) {
  errors.push('SUPABASE_SERVICE_ROLE_KEY is required for server/worker builds.');
}

if (errors.length > 0) {
  console.error('[supabase-env] Environment validation failed:');
  for (const message of errors) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log('[supabase-env] Environment validation passed.');
