/**
 * Query layer for scrape_anomalies table
 */

import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../config';
import { AnomalyQuery } from '../types';

function getSupabaseClient() {
  const config = getConfig();
  const supabaseUrl = config.supabaseUrl;
  const supabaseServiceKey = config.supabaseServiceKey;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function getRecentAnomalies(query: AnomalyQuery = {}): Promise<any[]> {
  const supabase = getSupabaseClient();
  const { marketplace, hours = 24, type, severity } = query;
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  let supabaseQuery = supabase
    .from('scrape_anomalies')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (marketplace) {
    supabaseQuery = supabaseQuery.eq('marketplace', marketplace);
  }
  
  if (type) {
    supabaseQuery = supabaseQuery.eq('type', type);
  }
  
  if (severity) {
    supabaseQuery = supabaseQuery.eq('severity', severity);
  }
  
  const { data, error } = await supabaseQuery;
  
  if (error) {
    console.error('[OPERATOR] Error querying anomalies:', error);
    throw new Error(`Failed to query anomalies: ${error.message}`);
  }
  
  return data || [];
}

