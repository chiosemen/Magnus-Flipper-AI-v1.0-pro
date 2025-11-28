import { API_URL } from "./env";
import { QueryClient } from "@tanstack/react-query";
import { createMagnusClient, type MagnusClient } from "@magnus-flipper-ai/api-client";

let client: MagnusClient | null = null;

export function getApiClient(): MagnusClient {
  if (!client) {
    client = createMagnusClient({
      baseUrl: API_URL,
      timeoutMs: 10000,
    });
  }
  return client;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnMount: "always",
    },
  },
});

export async function healthCheck() {
  const api = getApiClient();
  return api.health.check();
}
