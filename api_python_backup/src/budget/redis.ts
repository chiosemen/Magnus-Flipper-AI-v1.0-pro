import { createClient } from "redis";

let client: ReturnType<typeof createClient>;

export async function getRedis() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy: (retries) => Math.min(retries * 50, 1000) },
    });
    client.on("error", (e) => console.error("Redis error", e));
    await client.connect();
  }
  return client;
}
