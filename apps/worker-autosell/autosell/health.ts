/**
 * Health check endpoint for worker-autosell
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { performHealthCheck } from "@magnus-flipper-ai/core/healthcheck.js";

export async function healthCheck(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const health = await performHealthCheck("worker-autosell", supabaseUrl, supabaseKey);
    
    return {
      status: health.healthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(health, null, 2),
    };
  } catch (error: any) {
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        worker: "worker-autosell",
      }),
    };
  }
}

app.http("health", {
  methods: ["GET"],
  route: "health",
  handler: healthCheck,
});

