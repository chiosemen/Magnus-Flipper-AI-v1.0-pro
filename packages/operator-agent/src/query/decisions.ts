/**
 * Query layer for resolver_decisions table
 */

import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../config';
import { DecisionQuery } from '../types';

function getSupabaseClient() {
  const config = getConfig();
  const supabaseUrl = config.supabaseUrl;
  const supabaseServiceKey = config.supabaseServiceKey;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function getResolverDecisions(query: DecisionQuery = {}): Promise<any[]> {
  const supabase = getSupabaseClient();
  const { marketplace, hours = 24, chosen_source } = query;
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  let supabaseQuery = supabase
    .from('resolver_decisions')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (marketplace) {
    supabaseQuery = supabaseQuery.eq('marketplace', marketplace);
  }
  
  if (chosen_source) {
    supabaseQuery = supabaseQuery.eq('chosen_source', chosen_source);
  }
  
  const { data, error } = await supabaseQuery;
  
  if (error) {
    console.error('[OPERATOR] Error querying decisions:', error);
    throw new Error(`Failed to query decisions: ${error.message}`);
  }
  
  return data || [];
}

