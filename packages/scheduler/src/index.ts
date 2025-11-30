import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error(
    '[scheduler] REDIS_URL is not set. The worker will still run but cannot reach Redis.'
  );
}

const client: RedisClientType | null = redisUrl ? createClient({ url: redisUrl }) : null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scheduleJob(): Promise<void> {
  const job = {
    id: Date.now(),
    createdAt: new Date().toISOString()
  };

  console.log(`[scheduler] Scheduling job ${job.id}`);

  if (client) {
    await client.lPush('scraper:jobs', JSON.stringify(job));
  }
}

async function main() {
  console.log('[scheduler] Starting scheduler');

  if (client) {
    client.on('error', (err) => console.error('[scheduler] Redis error', err));
    await client.connect();
    console.log('[scheduler] Connected to Redis');
  }

  while (true) {
    try {
      await scheduleJob();
    } catch (err) {
      console.error('[scheduler] Error during scheduling', err);
    }
    await wait(60000);
  }
}

main().catch((err) => {
  console.error('[scheduler] Fatal startup error', err);
});
