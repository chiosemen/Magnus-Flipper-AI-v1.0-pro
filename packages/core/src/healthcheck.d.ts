/**
 * Health check utilities for workers
 * Provides lightweight "I'm alive + I can talk to Supabase" checks
 */
export interface HealthCheckResult {
    healthy: boolean;
    checks: {
        worker: boolean;
        supabase: boolean;
    };
    timestamp: string;
    worker: string;
    error?: string;
}
/**
 * Perform health check for a worker
 */
export declare function performHealthCheck(workerName: string, supabaseUrl?: string, supabaseKey?: string): Promise<HealthCheckResult>;
/**
 * Create HTTP health check handler
 */
export declare function createHealthCheckHandler(workerName: string, supabaseUrl?: string, supabaseKey?: string): (req: any, res: any) => Promise<void>;
//# sourceMappingURL=healthcheck.d.ts.map