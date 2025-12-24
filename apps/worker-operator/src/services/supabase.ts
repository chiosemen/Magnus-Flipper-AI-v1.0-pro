/**
 * Supabase service client (service role)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

if (!config.supabaseUrl || !config.supabaseServiceKey) {
  throw new Error('Missing Supabase configuration (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
}

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey
);

