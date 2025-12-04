/**
 * Health check endpoint for worker-scraper
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createHealthCheckHandler } from "@magnus-flipper-ai/core/healthcheck";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const healthHandler = createHealthCheckHandler("worker-scraper", supabaseUrl, supabaseKey);

export async function healthCheck(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  return new Promise((resolve) => {
    const res = {
      writeHead: (status: number, headers: Record<string, string>) => {
        resolve({
          status,
          headers: {
            'Content-Type': headers['Content-Type'] || 'application/json',
          },
        });
      },
      end: (body: string) => {
        resolve((prev: any) => ({
          ...prev,
          body,
        }));
      },
    };

    healthHandler(request, res as any);
  });
}

app.http("health", {
  methods: ["GET"],
  route: "health",
  handler: healthCheck,
});

