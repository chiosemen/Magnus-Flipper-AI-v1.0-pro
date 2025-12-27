const args = new Set(process.argv.slice(2));
const requireServiceRole = args.has('--require-service-role');

const errors = [];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseUrl.trim()) {
  errors.push('NEXT_PUBLIC_SUPABASE_URL is missing.');
} else {
  const lowered = supabaseUrl.toLowerCase();
  if (lowered.includes('localhost') || lowered.includes('127.0.0.1')) {
    errors.push(
      `NEXT_PUBLIC_SUPABASE_URL must not reference localhost (${supabaseUrl}).`
    );
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
