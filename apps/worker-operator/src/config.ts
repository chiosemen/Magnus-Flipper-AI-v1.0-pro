/**
 * Operator Worker Configuration
 */

export const config = {
  pollIntervalMs: parseInt(process.env.OPERATOR_POLL_INTERVAL_MS || '60000'), // 1 minute default
  workerId: process.env.WORKER_ID || 'worker-operator-001',
  
  // Supabase Configuration
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Health Monitoring
  healthScoreThreshold: parseFloat(process.env.OPERATOR_HEALTH_THRESHOLD || '50'),
  autoEscalateEnabled: process.env.OPERATOR_AUTO_ESCALATE !== 'false',
};

