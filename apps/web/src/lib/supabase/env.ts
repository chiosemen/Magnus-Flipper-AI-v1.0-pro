const LOCALHOST_MARKERS = ['localhost', '127.0.0.1'];

function assertSupabaseUrl(supabaseUrl: string): void {
  if (process.env.NODE_ENV === 'production') {
    const lowered = supabaseUrl.toLowerCase();
    if (LOCALHOST_MARKERS.some((marker) => lowered.includes(marker))) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL must not point to localhost in production'
      );
    }
  }
}

export function getSupabaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  assertSupabaseUrl(supabaseUrl);
  return supabaseUrl;
}

export function getSupabaseAnonKey(): string {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  return supabaseAnonKey;
}

export function getSupabaseEnv() {
  return {
    supabaseUrl: getSupabaseUrl(),
    supabaseAnonKey: getSupabaseAnonKey(),
  };
}

export function getSupabaseServiceRoleKey(): string {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  return serviceRoleKey;
}
