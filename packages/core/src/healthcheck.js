/**
 * Health check utilities for workers
 * Provides lightweight "I'm alive + I can talk to Supabase" checks
 */
import { createClient } from '@supabase/supabase-js';
/**
 * Perform health check for a worker
 */
export async function performHealthCheck(workerName, supabaseUrl, supabaseKey) {
    const result = {
        healthy: true,
        checks: {
            worker: true,
            supabase: false,
        },
        timestamp: new Date().toISOString(),
        worker: workerName,
    };
    // Check Supabase connectivity if credentials provided
    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            // Simple query to verify connectivity
            const { error } = await supabase.from('worker_logs').select('count').limit(1);
            if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (acceptable)
                throw error;
            }
            result.checks.supabase = true;
        }
        catch (error) {
            result.healthy = false;
            result.checks.supabase = false;
            result.error = error.message || 'Supabase health check failed';
        }
    }
    else {
        // If no Supabase credentials, just check worker is alive
        result.checks.supabase = true; // Skip check if not configured
    }
    return result;
}
/**
 * Create HTTP health check handler
 */
export function createHealthCheckHandler(workerName, supabaseUrl, supabaseKey) {
    return async (req, res) => {
        try {
            const health = await performHealthCheck(workerName, supabaseUrl, supabaseKey);
            const statusCode = health.healthy ? 200 : 503;
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(health, null, 2));
        }
        catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                worker: workerName,
            }));
        }
    };
}
//# sourceMappingURL=healthcheck.js.map