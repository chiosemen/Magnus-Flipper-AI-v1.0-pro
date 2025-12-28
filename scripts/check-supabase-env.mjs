import path from 'path';

const cwd = process.cwd();

if (process.env.VERCEL_ENV !== 'production') {
  console.log('[supabase-env] Skipped (not production)');
  process.exit(0);
}

if (!cwd.includes(`${path.sep}apps${path.sep}web`)) {
  console.log('[supabase-env] Skipped (not in apps/web)');
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [];
if (!supabaseUrl || !supabaseUrl.trim()) {
  missing.push('NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey || !supabaseAnonKey.trim()) {
  missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (missing.length > 0) {
  throw new Error(
    `[supabase-env] Missing required Supabase env vars: ${missing.join(', ')}`
  );
}

if (!serviceRoleKey || !serviceRoleKey.trim()) {
  console.warn('[supabase-env] SUPABASE_SERVICE_ROLE_KEY is missing (server-only).');
}

console.log('[supabase-env] Environment validation passed.');
