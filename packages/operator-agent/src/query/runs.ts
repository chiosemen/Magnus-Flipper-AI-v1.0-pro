/**
 * Query layer for scrape_runs table
 */

import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../config';
import { RunQuery } from '../types';

function getSupabaseClient() {
  const config = getConfig();
  const supabaseUrl = config.supabaseUrl;
  const supabaseServiceKey = config.supabaseServiceKey;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function getRecentRuns(query: RunQuery = {}): Promise<any[]> {
  const supabase = getSupabaseClient();
  const { marketplace, hours = 24, success } = query;
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  let supabaseQuery = supabase
    .from('scrape_runs')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (marketplace) {
    supabaseQuery = supabaseQuery.eq('marketplace', marketplace);
  }
  
  if (success !== undefined) {
    supabaseQuery = supabaseQuery.eq('success', success);
  }
  
  const { data, error } = await supabaseQuery;
  
  if (error) {
    console.error('[OPERATOR] Error querying runs:', error);
    throw new Error(`Failed to query runs: ${error.message}`);
  }
  
  return data || [];
}

