import path from 'path';

const cwd = process.cwd();

const vercelEnv = process.env.VERCEL_ENV;

if (vercelEnv !== 'production') {
  console.log('[supabase-env] Skipped (not production)');
  process.exit(0);
}

const inWebApp = cwd.includes(`${path.sep}apps${path.sep}web`);
if (!inWebApp) {
  console.log('[supabase-env] Skipped (not in apps/web)');
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.trim()) {
  throw new Error('[supabase-env] NEXT_PUBLIC_SUPABASE_URL is missing.');
}

if (!supabaseAnonKey || !supabaseAnonKey.trim()) {
  throw new Error('[supabase-env] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
}

console.log('[supabase-env] Environment validation passed.');
