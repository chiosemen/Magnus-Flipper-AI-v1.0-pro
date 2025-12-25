#!/usr/bin/env node

/**
 * Canary Ingestor Worker
 * 
 * Pulls ML analyzer artifacts and auto-supervisor health logs,
 * writes normalized metrics to Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase not configured for canary ingestor");
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

interface MLArtifact {
  decision: string;
  confidence: number;
  severity: string;
  summary: string;
  anomalies: string[];
}

interface HealthCheck {
  timestamp: string;
  status: 'OK' | 'FAIL';
  latency?: number;
}

async function downloadArtifacts() {
  try {
    // Use GitHub CLI to download latest artifacts
    const mlRun = execSync(
      'gh run list --workflow="🤖 ML Canary Analyzer" --limit 1 --json databaseId -q ".[0].databaseId"',
      { encoding: 'utf-8' }
    ).trim();

    if (mlRun && mlRun !== 'null') {
      execSync(`gh run download ${mlRun} --dir /tmp/canary-artifacts`, {
        stdio: 'inherit',
      });
    }
  } catch (error) {
    console.warn('Could not download artifacts:', error);
  }
}

async function ingestMLDecision() {
  const mlResultPath = '/tmp/canary-artifacts/ml_result.json';
  
  if (!fs.existsSync(mlResultPath)) {
    return;
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const mlData = JSON.parse(fs.readFileSync(mlResultPath, 'utf-8'));
    
    // Extract decision from OpenAI/DeepSeek response
    let decision: MLArtifact | null = null;
    
    if (mlData.choices?.[0]?.message?.content) {
      const content = mlData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      }
    }

    if (decision) {
      await supabase.from('canary_ml_decisions').insert({
        app_name: 'mf-worker-realtime',
        revision: 'latest',
        decision: decision.decision,
        confidence: decision.confidence,
        severity: decision.severity,
        summary: decision.summary,
        anomalies: decision.anomalies,
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Ingested ML decision:', decision.decision);
    }
  } catch (error) {
    console.error('Error ingesting ML decision:', error);
  }
}

async function ingestHealthChecks() {
  const healthPath = '/tmp/canary-artifacts/health_checks.json';
  
  if (!fs.existsSync(healthPath)) {
    return;
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const healthData = JSON.parse(fs.readFileSync(healthPath, 'utf-8'));
    
    if (Array.isArray(healthData)) {
      for (const check of healthData) {
        await supabase.from('canary_health_checks').insert({
          app_name: check.app_name || 'mf-worker-realtime',
          status: check.status || 'UNKNOWN',
          latency: check.latency,
          timestamp: check.timestamp || new Date().toISOString(),
        });
      }

      console.log(`✅ Ingested ${healthData.length} health checks`);
    }
  } catch (error) {
    console.error('Error ingesting health checks:', error);
  }
}

async function ingestLogs() {
  const logsPath = '/tmp/canary-artifacts/canary_logs.json';
  
  if (!fs.existsSync(logsPath)) {
    return;
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const logsData = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
    
    if (Array.isArray(logsData)) {
      for (const log of logsData.slice(-1000)) {
        await supabase.from('canary_logs').insert({
          app_name: 'mf-worker-realtime',
          revision: 'latest',
          level: log.level || 'INFO',
          message: log.message || log.text || JSON.stringify(log),
          timestamp: log.timestamp || log.time || new Date().toISOString(),
        });
      }

      console.log(`✅ Ingested ${Math.min(logsData.length, 1000)} log entries`);
    }
  } catch (error) {
    console.error('Error ingesting logs:', error);
  }
}

async function main() {
  console.log('🚀 Starting canary ingestor...');
  
  // Create artifacts directory
  fs.mkdirSync('/tmp/canary-artifacts', { recursive: true });

  // Download artifacts
  await downloadArtifacts();

  // Ingest data
  await ingestMLDecision();
  await ingestHealthChecks();
  await ingestLogs();

  console.log('✅ Ingestor complete');
}

main().catch(console.error);
